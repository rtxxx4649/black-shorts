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

    const videos = (data.items || []).map((video) => ({
      id: video.id,
      title: video.snippet?.title || "",
      thumbnail:
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.medium?.url ||
        video.snippet?.thumbnails?.default?.url ||
        "",
      duration: video.contentDetails?.duration || "",
      views: Number(video.statistics?.viewCount || 0),
      likes: Number(video.statistics?.likeCount || 0),
      comments: Number(video.statistics?.commentCount || 0),
      publishedAt: video.snippet?.publishedAt || ""
    }));

    function durationToSeconds(duration) {
      const match = duration.match(
        /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
      );

      if (!match) return null;

      const hours = Number(match[1] || 0);
      const minutes = Number(match[2] || 0);
      const seconds = Number(match[3] || 0);

      return hours * 3600 + minutes * 60 + seconds;
    }

    const shortsCandidates = videos.filter((video) => {
      const seconds = durationToSeconds(video.duration);

      return seconds !== null && seconds > 0 && seconds <= 60;
    });

    return res.status(200).json({
      regionCode,
      fetched: videos.length,
      shortsCandidates: shortsCandidates.slice(0, 10)
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch YouTube data"
    });
  }
}
