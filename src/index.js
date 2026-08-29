export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateVideos(env));
  },

  async fetch(request, env) {
    return new Response("TREND WORLD updater is running.");
  }
};

const COUNTRIES = [
  "US", "GB", "AU", "CA", "DE", "PH",
  "ES", "FR", "KR", "IT", "VN", "TR",
  "IN", "BR", "ID", "JP", "MX", "TH"
];

async function updateVideos(env) {
  const results = [];

  for (const regionCode of COUNTRIES) {
    try {
      const params = new URLSearchParams({
        part: "snippet,contentDetails,statistics",
        chart: "mostPopular",
        regionCode,
        videoCategoryId: "20",
        maxResults: "50",
        key: env.YOUTUBE_API_KEY
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          `YouTube API error ${regionCode}:`,
          JSON.stringify(data)
        );

        results.push({
          regionCode,
          success: false,
          error: data
        });

        continue;
      }

      const videos = (data.items || []).map((item) => ({
        region_code: regionCode,
        video_id: item.id,
        title: item.snippet?.title || "",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "",
        channel_title:
          item.snippet?.channelTitle || "",
        duration:
          item.contentDetails?.duration || "",
        views:
          Number(item.statistics?.viewCount || 0),
        likes:
          Number(item.statistics?.likeCount || 0),
        comments:
          Number(item.statistics?.commentCount || 0),
        published_at:
          item.snippet?.publishedAt || null,
        category_id:
          item.snippet?.categoryId || "20"
      }));

      /*
       * 現段階ではDBには保存しない。
       * Cloudflare Worker内で取得結果を処理するだけ。
       */

      results.push({
        regionCode,
        success: true,
        count: videos.length
      });

      console.log(
        `${regionCode}: ${videos.length} videos`
      );

    } catch (error) {
      console.error(
        `Failed ${regionCode}:`,
        error
      );

      results.push({
        regionCode,
        success: false,
        error: String(error)
      });
    }
  }

  console.log(
    "Update finished:",
    JSON.stringify(results)
  );
}
