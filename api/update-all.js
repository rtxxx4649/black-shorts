import { neon } from "@neondatabase/serverless";

const COUNTRIES = [
  "US", "GB", "AU", "CA", "DE", "PH",
  "ES", "FR", "KR", "IT", "VN", "TR",
  "IN", "BR", "ID", "JP", "MX", "TH"
];

export default async function handler(req, res) {
  try {
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
    const results = [];

    for (const regionCode of COUNTRIES) {
      try {
        const params = new URLSearchParams({
          part: "snippet,contentDetails,statistics",
          chart: "mostPopular",
          regionCode,
          videoCategoryId: "20",
          maxResults: "50",
          key: youtubeApiKey
        });

        const youtubeResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
        );

        const youtubeData = await youtubeResponse.json();

        if (!youtubeResponse.ok) {
          results.push({
            regionCode,
            success: false,
            error: youtubeData
          });
          continue;
        }

        const videos = (youtubeData.items || []).map((item) => ({
          region_code: regionCode,
          video_id: item.id,
          title: item.snippet?.title || "",
          thumbnail:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            "",
          channel_title: item.snippet?.channelTitle || "",
          duration: item.contentDetails?.duration || "",
          views: Number(item.statistics?.viewCount || 0),
          likes: Number(item.statistics?.likeCount || 0),
          comments: Number(item.statistics?.commentCount || 0),
          published_at: item.snippet?.publishedAt || null,
          category_id: item.snippet?.categoryId || "20",
          fetched_at: new Date().toISOString()
        }));

        await sql`
          DELETE FROM current_videos
          WHERE region_code = ${regionCode}
        `;

        for (const video of videos) {
          await sql`
            INSERT INTO current_videos (
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
            )
            VALUES (
              ${video.region_code},
              ${video.video_id},
              ${video.title},
              ${video.thumbnail},
              ${video.channel_title},
              ${video.duration},
              ${video.views},
              ${video.likes},
              ${video.comments},
              ${video.published_at},
              ${video.category_id},
              ${video.fetched_at}
            )
        `;
        }

        results.push({
          regionCode,
          success: true,
          fetched: videos.length,
          saved: videos.length
        });

      } catch (error) {
        results.push({
          regionCode,
          success: false,
          error: String(error)
        });
      }
    }

    const successful = results.filter(
      (r) => r.success
    ).length;

    return res.status(200).json({
      success: successful === COUNTRIES.length,
      totalRegions: COUNTRIES.length,
      successful,
      failed: COUNTRIES.length - successful,
      results
    });

  } catch (error) {
    console.error("update-all error:", error);

    return res.status(500).json({
      error: String(error)
    });
  }
}
