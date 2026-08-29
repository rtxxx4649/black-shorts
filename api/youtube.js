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

    return res.status(200).json({
      regionCode,
      count: data.items?.length || 0,
      items: data.items || []
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch YouTube videos"
    });
  }
}
