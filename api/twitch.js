const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

let cachedStreams = [];
let streamsUpdatedAt = 0;
const STREAMS_REFRESH_MS = 60_000;

async function getAppToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error('Twitch credentials are not configured');
  }

  const body = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Twitch token error: ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function fetchStreams(token, cursor = '') {
  const url = new URL('https://api.twitch.tv/helix/streams');
  url.searchParams.set('first', '100');
  if (cursor) url.searchParams.set('after', cursor);

  const response = await fetch(url.toString(), {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Twitch streams error: ${response.status}`);
  }

  return response.json();
}

async function getRankedStreams(token) {
  if (
    cachedStreams.length &&
    Date.now() - streamsUpdatedAt < STREAMS_REFRESH_MS
  ) {
    return cachedStreams;
  }

  const streams = [];
  let cursor = '';
  let pagesFetched = 0;

  while (streams.length < 1000 && pagesFetched < 10) {
    const data = await fetchStreams(token, cursor);
    const pageStreams = Array.isArray(data.data) ? data.data : [];
    streams.push(...pageStreams);

    const nextCursor = data.pagination?.cursor || '';
    pagesFetched += 1;

    if (!nextCursor || pageStreams.length === 0) break;
    cursor = nextCursor;
  }

  const englishStreams = streams.filter((stream) => stream.language === 'en');
  englishStreams.sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0));
  cachedStreams = englishStreams;
  streamsUpdatedAt = Date.now();

  return cachedStreams;
}

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const token = await getAppToken();
    const allStreams = await getRankedStreams(token);

    const seenParam = typeof req.query?.seen === 'string' ? req.query.seen : '';
    const seen = new Set(
      seenParam
        .split(',')
        .map((login) => login.trim().toLowerCase())
        .filter(Boolean)
    );

    const streams = allStreams
      .filter(
        (stream) =>
          stream.user_login &&
          !seen.has(stream.user_login.toLowerCase())
      )
      .slice(0, 100);

    const logins = [...new Set(streams.map((stream) => stream.user_login).filter(Boolean))];
    const profileMap = new Map();

    if (logins.length) {
      const userParams = new URLSearchParams();
      logins.forEach((login) => userParams.append('login', login));

      const usersResponse = await fetch(
        `https://api.twitch.tv/helix/users?${userParams.toString()}`,
        {
          headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!usersResponse.ok) {
        throw new Error(`Twitch users error: ${usersResponse.status}`);
      }

      const usersData = await usersResponse.json();
      const users = Array.isArray(usersData.data) ? usersData.data : [];
      users.forEach((user) => {
        if (user.login) {
          profileMap.set(user.login, user.profile_image_url || '');
        }
      });
    }

    const enrichedStreams = streams.map((stream) => ({
      ...stream,
      profile_image_url: profileMap.get(stream.user_login) || '',
    }));

    const stream = enrichedStreams[0] || null;

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      streams: enrichedStreams,
      live: !!stream,
      stream,
      updated_at: streamsUpdatedAt,
      refresh_interval_ms: STREAMS_REFRESH_MS,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Twitch streams' });
  }
}
