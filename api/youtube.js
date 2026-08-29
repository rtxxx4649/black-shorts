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

    const youtubeApiKey =
      process.env.YOUTUBE_API_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!youtubeApiKey) {
      return res.status(500).json({
        error:
          "YOUTUBE_API_KEY is not configured"
      });
    }

    if (!supabaseUrl) {
      return res.status(500).json({
        error:
          "NEXT_PUBLIC_SUPABASE_URL is not configured"
      });
    }

    if (!supabaseSecretKey) {
      return res.status(500).json({
        error:
          "SUPABASE_SECRET_KEY is not configured"
      });
    }

    /*
     * ==========================================
     * 1. YouTubeから取得
     * ==========================================
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
          youtubeApiKey
      });

    const youtubeResponse =
      await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
      );

    const youtubeData =
      await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      return res.status(
        youtubeResponse.status
      ).json(youtubeData);
    }

    /*
     * ==========================================
     * 2. YouTubeデータを整形
     * ==========================================
     */

    const gamingPopular =
      (youtubeData.items || []).map(
        (item) => {

          return {
            id:
              item.id,

            region_code:
              regionCode,

            video_id:
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

            channel_title:
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

            published_at:
              item.snippet
                ?.publishedAt || null,

            category_id:
              item.snippet
                ?.categoryId || "20",

            fetched_at:
              new Date().toISOString()
          };

        }
      );

    /*
     * ==========================================
     * 3. 今回の地域の古いデータを削除
     * ==========================================
     *
     * ※今回はテスト段階なので、
     *    同じ地域だけを入れ替える。
     */

    const deleteResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/current_videos?region_code=eq.${encodeURIComponent(regionCode)}`,
        {
          method:
            "DELETE",

          headers: {
            apikey:
              supabaseSecretKey,

            Authorization:
              `Bearer ${supabaseSecretKey}`,

            "Content-Type":
              "application/json"
          }
        }
      );

    if (!deleteResponse.ok) {

      const deleteError =
        await deleteResponse.text();

      console.error(
        "Supabase delete error:",
        deleteError
      );

      return res.status(500).json({
        error:
          "Failed to delete old videos",

        details:
          deleteError
      });
    }

    /*
     * ==========================================
     * 4. 新しいデータをSupabaseへ保存
     * ==========================================
     */

    const insertRows =
      gamingPopular.map(
        (video, index) => {

          return {
            id:
              Date.now() +
              index,

            region_code:
              video.region_code,

            video_id:
              video.video_id,

            title:
              video.title,

            thumbnail:
              video.thumbnail,

            channel_title:
              video.channel_title,

            duration:
              video.duration,

            views:
              video.views,

            likes:
              video.likes,

            comments:
              video.comments,

            published_at:
              video.published_at,

            category_id:
              video.category_id,

            fetched_at:
              video.fetched_at
          };

        }
      );

    if (insertRows.length > 0) {

      const insertResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/current_videos`,
          {
            method:
              "POST",

            headers: {
              apikey:
                supabaseSecretKey,

              Authorization:
                `Bearer ${supabaseSecretKey}`,

              "Content-Type":
                "application/json",

              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify(
                insertRows
              )
          }
        );

      if (!insertResponse.ok) {

        const insertError =
          await insertResponse.text();

        console.error(
          "Supabase insert error:",
          insertError
        );

        return res.status(500).json({
          error:
            "Failed to save videos to Supabase",

          details:
            insertError
        });
      }
    }

    /*
     * ==========================================
     * 5. 結果を返す
     * ==========================================
     */

    return res.status(200).json({

      regionCode:
        regionCode,

      fetched:
        gamingPopular.length,

      saved:
        insertRows.length,

      gamingPopular:
        gamingPopular

    });

  } catch (error) {

    console.error(
      "youtube API error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch and save YouTube videos"
    });
  }
}
