import { neon } from "@neondatabase/serverless";

async function videosApi(request, env) {
  try {
    const url = new URL(request.url);
    const regionCode = String(url.searchParams.get("regionCode") || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(regionCode)) {
      return Response.json({ error: "Invalid regionCode" }, { status: 400 });
    }

    const databaseUrl = env.DATABASE_URL;
    const youtubeApiKey = env.YOUTUBE_API_KEY;
    if (!databaseUrl) return Response.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    if (!youtubeApiKey) return Response.json({ error: "YOUTUBE_API_KEY is not configured" }, { status: 500 });

    const sql = neon(databaseUrl);
    const videos = await sql`
      SELECT id, region_code, video_id, title, thumbnail, channel_title, duration,
             views, likes, comments, published_at, category_id, fetched_at
      FROM current_videos
      WHERE region_code = ${regionCode}
      ORDER BY views DESC
    `;

    if (!videos.length) return Response.json({ regionCode, count: 0, videos: [] });

    const videoIds = videos.map(v => v.video_id).filter(Boolean);
    const videoParams = new URLSearchParams({ part: "snippet,statistics", id: videoIds.join(","), key: youtubeApiKey });
    const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videoParams}`);
    const videoData = await videoResponse.json();
    if (!videoResponse.ok) return Response.json(videoData, { status: videoResponse.status });

    const channelIds = [...new Set((videoData.items || []).map(i => i.snippet?.channelId).filter(Boolean))];
    const channelMap = new Map();
    if (channelIds.length) {
      const channelParams = new URLSearchParams({ part: "snippet", id: channelIds.join(","), key: youtubeApiKey });
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?${channelParams}`);
      const channelData = await channelResponse.json();
      if (!channelResponse.ok) return Response.json(channelData, { status: channelResponse.status });
      for (const channel of channelData.items || []) {
        channelMap.set(channel.id, {
          channel_avatar: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || ""
        });
      }
    }

    const statsById = new Map((videoData.items || []).map(i => [i.id, i.statistics || {}]));
    const channelIdByVideoId = new Map((videoData.items || []).map(i => [i.id, i.snippet?.channelId || ""]));
    const enriched = videos.map(video => {
      const channelId = channelIdByVideoId.get(video.video_id) || "";
      const statistics = statsById.get(video.video_id) || {};
      const channel = channelMap.get(channelId) || {};
      return {
        ...video,
        views: statistics.viewCount ?? video.views ?? 0,
        likes: statistics.likeCount ?? video.likes ?? 0,
        comments: statistics.commentCount ?? video.comments ?? 0,
        channel_id: channelId,
        channel_avatar: channel.channel_avatar || ""
      };
    });
    return Response.json({ regionCode, count: enriched.length, videos: enriched });
  } catch (error) {
    console.error("videos API error:", error);
    return Response.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/videos") return videosApi(request, env);

    // The original site uses index2.html; Cloudflare serves the built copy as index.html.
    return env.ASSETS.fetch(request);
  }
};
