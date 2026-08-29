export default async function handler(req, res) {
  try {
    const regionCode = String(
      req.query.regionCode || ""
    ).toUpperCase();

    /*
    ==========================================
      REGION CODE VALIDATION
    ==========================================
    */

    if (!/^[A-Z]{2}$/.test(regionCode)) {
      return res.status(400).json({
        error: "Invalid regionCode"
      });
    }


    /*
    ==========================================
      YOUTUBE API KEY
    ==========================================
    */

    const apiKey =
      process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "YOUTUBE_API_KEY is not configured"
      });
    }


    /*
    ==========================================
      MOST POPULAR GAMING
    ==========================================

      chart:
        mostPopular

      regionCode:
        各国の地域コード

      videoCategoryId:
        20 = Gaming

      Search API:
        使用しない

      最大50件取得
    */

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


    /*
    ==========================================
      YOUTUBE DATA API
    ==========================================
    */

    const response =
      await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
      );


    const data =
      await response.json();


    /*
    ==========================================
      API ERROR
    ==========================================
    */

    if (!response.ok) {

      return res.status(
        response.status
      ).json(data);

    }


    /*
    ==========================================
      FORMAT VIDEOS
    ==========================================

      フロント側では
      data.gamingPopular
      を使用する。
    */

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


    /*
    ==========================================
      RESPONSE
    ==========================================
    */

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
