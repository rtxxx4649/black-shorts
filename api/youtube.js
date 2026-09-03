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

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!youtubeApiKey) {
  return res.status(500).json({
    error: "YOUTUBE_API_KEY is not configured"
  });
}

if (!databaseUrl) {
  return res.status(500).json({
    error: "DATABASE_URL is not configured"
  });
}

const sql = neon(databaseUrl);

const params = new URLSearchParams({
  part: "snippet,contentDetails,statistics",
  chart: "mostPopular",
  regionCode: regionCode,
  videoCategoryId: "20",
  maxResults: "50",
  key: youtubeApiKey
});

const youtubeResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
);

const youtubeData = await youtubeResponse.json();

if (!youtubeResponse.ok) {
  return res.status(
    youtubeResponse.status
  ).json(youtubeData);
}

const items = Array.isArray(youtubeData.items) ? youtubeData.items : [];

// Enforce Gaming category 20 using the category returned in each video's snippet.
const gamingItems = items.filter(
  (item) => String(item.snippet?.categoryId || "") === "20"
);

// Keep only videos whose default audio track is explicitly English.
// Videos without English audio-language metadata are excluded rather than
// guessing from the title or channel name.
const englishGamingItems = gamingItems.filter((item) => {
  const language = String(item.snippet?.defaultAudioLanguage || "").toLowerCase();
  return language === "en" || language.startsWith("en-");
});

// videos.list gives us the channelId, while the channel avatar itself
// comes from channels.list(snippet). Fetch unique channels in batches.
const channelIds = [
  ...new Set(
    englishGamingItems
      .map((item) => item.snippet?.channelId)
      .filter(Boolean)
  )
];

const channelAvatarMap = new Map();

for (let i = 0; i < channelIds.length; i += 50) {
  const batch = channelIds.slice(i, i + 50);
  const channelParams = new URLSearchParams({
    part: "snippet",
    id: batch.join(","),
    maxResults: "50",
    key: youtubeApiKey
  });

  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${channelParams.toString()}`
  );
  const channelData = await channelResponse.json();

  if (!channelResponse.ok) {
    return res.status(
      channelResponse.status
    ).json(channelData);
  }

  for (const channel of channelData.items || []) {
    const avatar =
      channel.snippet?.thumbnails?.high?.url ||
      channel.snippet?.thumbnails?.medium?.url ||
      channel.snippet?.thumbnails?.default?.url ||
      "";

    channelAvatarMap.set(channel.id, avatar);
  }
}

const gamingPopular = englishGamingItems.map(
  (item) => ({
    region_code: regionCode,
    video_id: item.id,
    title: item.snippet?.title || "",
    thumbnail:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      "",
    channel_id: item.snippet?.channelId || "",
    channel_title: item.snippet?.channelTitle || "",
    channel_avatar: channelAvatarMap.get(item.snippet?.channelId) || "",
    duration: item.contentDetails?.duration || "",
    views: Number(item.statistics?.viewCount || 0),
    likes: Number(item.statistics?.likeCount || 0),
    comments: Number(item.statistics?.commentCount || 0),
    published_at: item.snippet?.publishedAt || null,
    category_id: "20",
    fetched_at: new Date().toISOString()
  })
);

const queries = [
  sql`
    DELETE FROM current_videos
    WHERE region_code = ${regionCode}
  `
];

for (const video of gamingPopular) {
  queries.push(sql`
    INSERT INTO current_videos (
      region_code,
      video_id,
      title,
      thumbnail,
      channel_id,
      channel_title,
      channel_avatar,
      duration,
      views,
      likes,
      comments,
      published_at,
      category_id,
      fetched_at
    )
    VALUES (
      ${video.region_code},
      ${video.video_id},
      ${video.title},
      ${video.thumbnail},
      ${video.channel_id},
      ${video.channel_title},
      ${video.channel_avatar},
      ${video.duration},
      ${video.views},
      ${video.likes},
      ${video.comments},
      ${video.published_at},
      ${video.category_id},
      ${video.fetched_at}
    )
  `);
}

await sql.transaction(queries);

return res.status(200).json({
  regionCode,
  fetched: gamingPopular.length,
  saved: gamingPopular.length,
  gamingPopular
});

} catch (error) {
console.error("youtube API error:", error);

return res.status(500).json({
  error: "Failed to fetch and save YouTube videos"
});

}
}
