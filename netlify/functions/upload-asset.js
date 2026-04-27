// Accepts POST with JSON body: { path: "offerings/id.jpg", content: "<base64>" }
// Commits the file to /assets/{path} in the GitHub repo.
// NOTE: Add authentication for production use (see save-content.js note).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Allow only safe path characters; block path traversal
function sanitizePath(raw) {
  return String(raw)
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/\-_. ]/g, '')
    .replace(/\.\.+/g, '')
    .replace(/^\/+/, '');
}

function encodeRepoPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function hasFileExtension(path) {
  return /\.[a-zA-Z0-9]{2,8}$/.test(path);
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { GITHUB_PAT, GITHUB_REPO, GITHUB_BRANCH } = process.env;
  if (!GITHUB_PAT || !GITHUB_REPO || !GITHUB_BRANCH) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing required environment variables' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { path: rawPath, content: fileContent } = body;
  if (!rawPath || !fileContent) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing path or content' }) };
  }

  const safePath = sanitizePath(rawPath);
  if (!safePath) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid path' }) };
  }
  if (!hasFileExtension(safePath)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Asset path must include a file name and extension' }) };
  }

  const filePath = `assets/${safePath}`;
  const encodedFilePath = encodeRepoPath(filePath);

  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_PAT}`,
    'Content-Type': 'application/json',
    'User-Agent': 'CandlerFoundry-CMS',
  };

  // Asset uploads are intentionally create-only. Page config publishing is separate;
  // uploading a new asset must never overwrite a built-in image or prior upload.
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodedFilePath}?ref=${GITHUB_BRANCH}`,
    { headers: ghHeaders }
  );
  if (getRes.ok) {
    return {
      statusCode: 409,
      headers: CORS,
      body: JSON.stringify({ error: `Asset already exists: ${filePath}. Choose a new Git asset location.` }),
    };
  }
  if (getRes.status !== 404) {
    const errText = await getRes.text();
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `GitHub GET failed (${getRes.status})`, detail: errText }),
    };
  }

  const putPayload = {
    message: `Upload asset: ${filePath}`,
    content: fileContent, // already base64
    branch: GITHUB_BRANCH,
  };

  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodedFilePath}`,
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
    body: JSON.stringify({ url: `/${filePath}` }),
  };
};
