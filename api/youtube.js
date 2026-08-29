export default async function handler(req, res) {
  try {
    const regionCode = String(req.query.regionCode || "").toUpperCase();

    if (!/^[A-Z]{2}$/.test(regionCode)) {
      return res.status(400).json({
        error: "Invalid regionCode"
      });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "YOUTUBE_API_KEY is not configured"
      });
    }

    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      regionCode,
      videoCategoryId: "10",
      maxResults: "50",
      key: apiKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const videos = (data.items || []).map(video => {
      const duration = parseDuration(
        video.contentDetails?.duration || "PT0S"
      );

      return {
        id: video.id,
        title: video.snippet?.title || "",
        publishedAt: video.snippet?.publishedAt || null,
        thumbnail:
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",
        duration,
        viewCount:
          Number(video.statistics?.viewCount || 0),
        likeCount:
          Number(video.statistics?.likeCount || 0),
        commentCount:
          Number(video.statistics?.commentCount || 0)
      };
    });

    /*
     * Shorts判定
     *
     * YouTube Data APIにはShorts専用フィールドがないため、
     * 現在は動画時間を利用した候補判定。
     *
     * 60秒以下をShorts候補とする。
     */
    const shorts = videos
      .filter(video => video.duration <= 60)
      .slice(0, 10);

    return res.status(200).json({
      regionCode,
      fetched: videos.length,
      shorts: shorts.length,
      items: shorts
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch YouTube data"
    });
  }
}


/*
 * ISO 8601 duration
 * 例:
 * PT30S     → 30
 * PT1M      → 60
 * PT1M30S   → 90
 * PT2H      → 7200
 */
function parseDuration(duration) {
  const match = duration.match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  );

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}
