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
        video.contentDetails?.duration
      );

      return {
        id: video.id,
        title: video.snippet?.title || "",
        publishedAt: video.snippet?.publishedAt || "",
        thumbnail:
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",
        duration,
        viewCount: Number(video.statistics?.viewCount || 0),
        likeCount: Number(video.statistics?.likeCount || 0),
        commentCount: Number(video.statistics?.commentCount || 0)
      };
    });

    /*
     * YouTube officially classifies eligible square/vertical
     * videos up to 3 minutes as Shorts.
     *
     * videos.list does not expose a direct "isShort" field,
     * so this endpoint does not claim a 100% definitive Shorts
     * classification from API metadata alone.
     */
    const candidates = videos.filter(video => {
      return video.duration > 0 && video.duration <= 180;
    });

    const shorts = candidates.slice(0, 10);

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
 * Example:
 * PT45S   -> 45
 * PT1M20S -> 80
 * PT2M    -> 120
 * PT3M    -> 180
 */
function parseDuration(value) {
  if (!value) {
    return 0;
  }

  const match = value.match(
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
