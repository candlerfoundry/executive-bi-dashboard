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
    .replace(/[^a-zA-Z0-9/\-_.]/g, '')
    .replace(/\.\.+/g, '')
    .replace(/^\/+/, '');
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

  const filePath = `assets/${safePath}`;

  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_PAT}`,
    'Content-Type': 'application/json',
    'User-Agent': 'CandlerFoundry-CMS',
  };

  // Get existing file SHA if present (required for updates)
  let sha;
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
    { headers: ghHeaders }
  );
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  const putPayload = {
    message: `Upload asset: ${filePath}`,
    content: fileContent, // already base64
    branch: GITHUB_BRANCH,
  };
  if (sha) putPayload.sha = sha;

  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
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
