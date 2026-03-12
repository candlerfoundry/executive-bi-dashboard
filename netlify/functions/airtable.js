const BASE_ID = 'appiL0Z2RilcAT2Cw';
const AIRTABLE_API = 'https://api.airtable.com/v0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'AIRTABLE_API_KEY not configured' }),
    };
  }

  const { table, view } = event.queryStringParameters || {};
  if (!table) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing required query parameter: table' }),
    };
  }

  const records = [];
  let offset = undefined;

  try {
    do {
      const params = new URLSearchParams();
      if (view) params.set('view', view);
      if (offset) params.set('offset', offset);

      const url = `${AIRTABLE_API}/${BASE_ID}/${encodeURIComponent(table)}?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          statusCode: res.status,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: `Airtable error ${res.status}`, detail: text }),
        };
      }

      const data = await res.json();
      records.push(...data.records);
      offset = data.offset;
    } while (offset);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
