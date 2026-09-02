import { neon } from "@neondatabase/serverless";

let twitchToken = null;
let twitchTokenExpiresAt = 0;
let twitchStreams = [];
let twitchStreamsUpdatedAt = 0;
const TWITCH_REFRESH_MS = 60_000;

async function getTwitchAppToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId) throw new Error("TWITCH_CLIENT_ID is not configured");
  if (!clientSecret) throw new Error("TWITCH_CLIENT_SECRET is not configured");
  if (twitchToken && Date.now() < twitchTokenExpiresAt - 60_000) return twitchToken;

  const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" });
  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: "POST" });
  if (!response.ok) throw new Error(`Twitch token error: ${response.status}`);
  const data = await response.json();
  twitchToken = data.access_token;
  twitchTokenExpiresAt = Date.now() + Number(data.expires_in || 0) * 1000;
  return twitchToken;
}

async function twitchApi(request) {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) return Response.json({ error: "TWITCH_CLIENT_ID is not configured" }, { status: 500 });

    const token = await getTwitchAppToken();
    const url = new URL(request.url);
    const seen = new Set((url.searchParams.get("seen") || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean));

    if (!twitchStreams.length || Date.now() - twitchStreamsUpdatedAt >= TWITCH_REFRESH_MS) {
      const streams = [];
      let cursor = "";
      let pages = 0;
      while (streams.length < 1000 && pages < 10) {
        const streamsUrl = new URL("https://api.twitch.tv/helix/streams");
        streamsUrl.searchParams.set("first", "100");
        if (cursor) streamsUrl.searchParams.set("after", cursor);
        const response = await fetch(streamsUrl, { headers: { "Client-ID": clientId, Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(`Twitch streams error: ${response.status}`);
        const data = await response.json();
        const pageStreams = Array.isArray(data.data) ? data.data : [];
        streams.push(...pageStreams);
        cursor = data.pagination?.cursor || "";
        pages += 1;
        if (!cursor || !pageStreams.length) break;
      }
      streams.sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0));
      twitchStreams = streams;
      twitchStreamsUpdatedAt = Date.now();
    }

    const streams = twitchStreams.filter(s => s.user_login && !seen.has(s.user_login.toLowerCase())).slice(0, 100);
    const logins = [...new Set(streams.map(s => s.user_login).filter(Boolean))];
    const profileMap = new Map();
    if (logins.length) {
      const usersUrl = new URL("https://api.twitch.tv/helix/users");
      for (const login of logins) usersUrl.searchParams.append("login", login);
      const response = await fetch(usersUrl, { headers: { "Client-ID": clientId, Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Twitch users error: ${response.status}`);
      const data = await response.json();
      for (const user of data.data || []) if (user.login) profileMap.set(user.login, user.profile_image_url || "");
    }

    const enrichedStreams = streams.map(s => ({ ...s, profile_image_url: profileMap.get(s.user_login) || "" }));
    const stream = enrichedStreams[0] || null;
    return Response.json({ streams: enrichedStreams, live: !!stream, stream, updated_at: twitchStreamsUpdatedAt, refresh_interval_ms: TWITCH_REFRESH_MS }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("twitch API error:", error);
    return Response.json({ error: "Failed to fetch Twitch streams" }, { status: 500 });
  }
}

async function videosApi(request) {
  try {
    const url = new URL(request.url);
    const rawRegionCode = String(url.searchParams.get("regionCode") || "JP").trim().toUpperCase();
    const regionCode = rawRegionCode.slice(0, 2);
    if (!/^[A-Z]{2}$/.test(regionCode)) return Response.json({ error: "Invalid regionCode", received: rawRegionCode }, { status: 400 });

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return Response.json({ error: "DATABASE_URL is not configured" }, { status: 500 });

    const sql = neon(databaseUrl);
    const videos = await sql`
      SELECT id, region_code, video_id, title, thumbnail, channel_id, channel_title,
             channel_avatar, duration, views, likes, comments, published_at,
             category_id, fetched_at
      FROM current_videos
      WHERE region_code = ${regionCode}
      ORDER BY views DESC
    `;

    return Response.json({
      regionCode,
      count: videos.length,
      videos: videos.map(v => ({
        ...v,
        channel_id: v.channel_id || "",
        channel_avatar: v.channel_avatar || ""
      }))
    });
  } catch (error) {
    console.error("videos API error:", error);
    return Response.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export default async function handler(request) {
  const path = new URL(request.url).pathname;
  if (path === "/api/twitch") return twitchApi(request);
  if (path === "/api/videos") return videosApi(request);
  return new Response("Not found", { status: 404 });
}

export const config = {
  path: ["/api/twitch", "/api/videos"]
};
