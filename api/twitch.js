const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAppToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    client_secret: TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(`Twitch token error: ${res.status}`);
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

export default async function handler(req, res) {
  try {
    const token = await getAppToken();
    const seenParam = typeof req.query?.seen === 'string' ? req.query.seen : '';
    const seen = new Set(
      seenParam
        .split(',')
        .map((login) => login.trim().toLowerCase())
        .filter(Boolean)
    );

    const eligibleStreams = [];
    let cursor = '';
    let pagesFetched = 0;

    while (eligibleStreams.length < 100 && pagesFetched < 10) {
      const data = await fetchStreams(token, cursor);
      const streams = Array.isArray(data.data) ? data.data : [];

      for (const stream of streams) {
        if (stream.user_login && !seen.has(stream.user_login.toLowerCase())) {
          eligibleStreams.push(stream);
        }
      }

      const nextCursor = data.pagination?.cursor || '';
      pagesFetched += 1;

      if (!nextCursor || streams.length === 0) {
        break;
      }

      cursor = nextCursor;
    }

    eligibleStreams.sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0));
    const streams = eligibleStreams.slice(0, 100);

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
    res.status(200).json({
      streams: enrichedStreams,
      live: !!stream,
      stream,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Twitch streams' });
  }
}
