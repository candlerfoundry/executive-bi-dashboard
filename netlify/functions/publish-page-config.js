const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-CMS-Secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sanitizePath(raw) {
  return String(raw || '')
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/\-_.]/g, '')
    .replace(/\.\.+/g, '')
    .replace(/^\/+/, '');
}

function isAllowedPath(path) {
  return (
    path === 'assets/page-config/mission-page.json' ||
    path === 'assets/page-config/candler-impact.json' ||
    path === 'assets/page-config/growth-reach.json' ||
    path === 'assets/page-config/theoed.json'
  );
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { GITHUB_PAT, GITHUB_REPO, GITHUB_BRANCH, CMS_SECRET } = process.env;
  if (!GITHUB_PAT || !GITHUB_REPO || !GITHUB_BRANCH) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing required environment variables (GITHUB_PAT, GITHUB_REPO, GITHUB_BRANCH)' }),
    };
  }

  if (CMS_SECRET) {
    const supplied = event.headers['x-cms-secret'] || event.headers['X-CMS-Secret'];
    if (supplied !== CMS_SECRET) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const files = Array.isArray(body.files) ? body.files : [];
  const commitMessage = body.commitMessage || 'Publish page config via editor';
  if (!files.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No files provided' }) };
  }

  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_PAT}`,
    'Content-Type': 'application/json',
    'User-Agent': 'CandlerFoundry-PageEditor',
  };

  const results = [];

  for (const file of files) {
    const safePath = sanitizePath(file.path);
    if (!isAllowedPath(safePath)) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: `Path not allowed: ${file.path}` }),
      };
    }

    const serialized = JSON.stringify(file.content || {}, null, 2);
    let sha;
    let existingSerialized = null;
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${safePath}?ref=${GITHUB_BRANCH}`,
      { headers: ghHeaders }
    );
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
      if (existing.content) {
        existingSerialized = Buffer.from(String(existing.content).replace(/\n/g, ''), 'base64').toString('utf8');
      }
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: `GitHub GET failed (${getRes.status})`, detail: errText, path: safePath }),
      };
    }

    if (existingSerialized === serialized) {
      results.push({ path: safePath, unchanged: true });
      continue;
    }

    const putPayload = {
      message: commitMessage,
      content: Buffer.from(serialized).toString('base64'),
      branch: GITHUB_BRANCH,
    };
    if (sha) putPayload.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${safePath}`,
      { method: 'PUT', headers: ghHeaders, body: JSON.stringify(putPayload) }
    );
    if (!putRes.ok) {
      const errText = await putRes.text();
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: `GitHub PUT failed (${putRes.status})`, detail: errText, path: safePath }),
      };
    }
    results.push({ path: safePath });
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, files: results }),
  };
};
