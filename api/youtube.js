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

    const apiKey =
      process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "YOUTUBE_API_KEY is not configured"
      });
    }

    const params =
      new URLSearchParams({
        part:
          "snippet,contentDetails,statistics",

        chart:
          "mostPopular",

        regionCode:
          regionCode,

        videoCategoryId:
          "20",

        maxResults:
          "50",

        key:
          apiKey
      });

    const response =
      await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
      );

    const data =
      await response.json();

    if (!response.ok) {
      return res.status(
        response.status
      ).json(data);
    }

    const gamingPopular =
      (data.items || []).map(
        item => {

          return {
            id:
              item.id,

            title:
              item.snippet?.title || "",

            thumbnail:
              item.snippet?.thumbnails
                ?.high?.url ||
              item.snippet?.thumbnails
                ?.medium?.url ||
              item.snippet?.thumbnails
                ?.default?.url ||
              "",

            channelTitle:
              item.snippet?.channelTitle || "",

            duration:
              item.contentDetails
                ?.duration || "",

            views:
              Number(
                item.statistics
                  ?.viewCount || 0
              ),

            likes:
              Number(
                item.statistics
                  ?.likeCount || 0
              ),

            comments:
              Number(
                item.statistics
                  ?.commentCount || 0
              ),

            publishedAt:
              item.snippet
                ?.publishedAt || "",

            categoryId:
              item.snippet
                ?.categoryId || "20"
          };

        }
      );

    return res.status(200).json({

      regionCode:
        regionCode,

      fetched:
        gamingPopular.length,

      gamingPopular:
        gamingPopular

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Failed to fetch YouTube videos"
    });

  }
}
