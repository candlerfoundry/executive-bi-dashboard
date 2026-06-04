// NOTE: This endpoint uses the server-side GITHUB_PAT to write to the repo.
// For production, add authentication (e.g. a shared CMS_SECRET header) to
// prevent unauthenticated calls from overwriting content.json.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-CMS-Secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async function (event) {
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
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { content } = body;
  if (!content || typeof content !== 'object') {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing or invalid content field' }) };
  }

  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_PAT}`,
    'Content-Type': 'application/json',
    'User-Agent': 'CandlerFoundry-CMS',
  };

  // Get current file SHA (needed for updates; absent on first create)
  let sha;
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/content.json?ref=${GITHUB_BRANCH}`,
    { headers: ghHeaders }
  );
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  } else if (getRes.status !== 404) {
    const errText = await getRes.text();
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `GitHub GET failed (${getRes.status})`, detail: errText }),
    };
  }

  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const putPayload = {
    message: 'Update content.json via CMS',
    content: encoded,
    branch: GITHUB_BRANCH,
  };
  if (sha) putPayload.sha = sha;

  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/content.json`,
    { method: 'PUT', headers: ghHeaders, body: JSON.stringify(putPayload) }
  );

  if (!putRes.ok) {
    const errText = await putRes.text();
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `GitHub PUT failed (${putRes.status})`, detail: errText }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
