import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    const regionCode = String(
      req.query.regionCode || ""
    ).toUpperCase();

    if (!/^[A-Z]{2}$/.test(regionCode)) {
      return res.status(400).json({
        error: "Invalid regionCode"
      });
    }

    const databaseUrl = process.env.DATABASE_URL;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "DATABASE_URL is not configured"
      });
    }

    if (!youtubeApiKey) {
      return res.status(500).json({
        error: "YOUTUBE_API_KEY is not configured"
      });
    }

    const sql = neon(databaseUrl);

    const videos = await sql`
      SELECT
        id,
        region_code,
        video_id,
        title,
        thumbnail,
        channel_title,
        duration,
        views,
        likes,
        comments,
        published_at,
        category_id,
        fetched_at
      FROM current_videos
      WHERE region_code = ${regionCode}
      ORDER BY views DESC
    `;

    if (!videos.length) {
      return res.status(200).json({
        regionCode,
        count: 0,
        videos: []
      });
    }

    const videoIds = videos.map((video) => video.video_id).filter(Boolean);
    const videoParams = new URLSearchParams({
      part: "snippet,statistics",
      id: videoIds.join(","),
      key: youtubeApiKey
    });

    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`
    );
    const videoData = await videoResponse.json();

    if (!videoResponse.ok) {
      return res.status(videoResponse.status).json(videoData);
    }

    const channelIds = [...new Set(
      (videoData.items || [])
        .map((item) => item.snippet?.channelId)
        .filter(Boolean)
    )];

    const channelMap = new Map();

    if (channelIds.length) {
      const channelParams = new URLSearchParams({
        part: "snippet",
        id: channelIds.join(","),
        key: youtubeApiKey
      });

      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?${channelParams.toString()}`
      );
      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
        return res.status(channelResponse.status).json(channelData);
      }

      for (const channel of channelData.items || []) {
        channelMap.set(channel.id, {
          channel_id: channel.id,
          channel_avatar:
            channel.snippet?.thumbnails?.high?.url ||
            channel.snippet?.thumbnails?.medium?.url ||
            channel.snippet?.thumbnails?.default?.url ||
            ""
        });
      }
    }

    const videoStatsById = new Map(
      (videoData.items || []).map((item) => [
        item.id,
        item.statistics || {}
      ])
    );

    const channelIdByVideoId = new Map(
      (videoData.items || []).map((item) => [
        item.id,
        item.snippet?.channelId || ""
      ])
    );

    const enrichedVideos = videos.map((video) => {
      const channelId = channelIdByVideoId.get(video.video_id) || "";
      const channel = channelMap.get(channelId) || {};
      const statistics = videoStatsById.get(video.video_id) || {};

      return {
        ...video,
        views: statistics.viewCount ?? video.views ?? 0,
        likes: statistics.likeCount ?? video.likes ?? 0,
        comments: statistics.commentCount ?? video.comments ?? 0,
        channel_id: channelId,
        channel_avatar: channel.channel_avatar || ""
      };
    });

    return res.status(200).json({
      regionCode,
      count: enrichedVideos.length,
      videos: enrichedVideos
    });

  } catch (error) {
    console.error("videos API error:", error);

    return res.status(500).json({
      error: "Failed to fetch videos"
    });
  }
}
