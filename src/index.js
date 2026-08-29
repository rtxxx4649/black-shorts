export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(updateVideos(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/test") {
      const result = await updateVideos(env);

      return new Response(
        JSON.stringify(result, null, 2),
        {
          headers: {
            "content-type": "application/json; charset=UTF-8"
          }
        }
      );
    }

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
        results.push({
          regionCode,
          success: false,
          error: data
        });
        continue;
      }

      results.push({
        regionCode,
        success: true,
        count: (data.items || []).length
      });

      console.log(
        `${regionCode}: ${(data.items || []).length} videos`
      );

    } catch (error) {
      results.push({
        regionCode,
        success: false,
        error: String(error)
      });
    }
  }

  return {
    success: results.every((r) => r.success),
    results
  };
}
