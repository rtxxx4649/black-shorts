import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    const regionCode = String(req.query.regionCode || "").toUpperCase();

    if (!/^[A-Z]{2}$/.test(regionCode)) {
      return res.status(400).json({ error: "Invalid regionCode" });
    }

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({ error: "DATABASE_URL is not configured" });
    }

    const sql = neon(databaseUrl);

    const videos = await sql`
      SELECT
        id,
        region_code,
        video_id,
        title,
        thumbnail,
        channel_id,
        channel_title,
        channel_avatar,
        duration,
        views,
        likes,
        comments,
        published_at,
        category_id,
        fetched_at
      FROM current_videos
      WHERE region_code = ${regionCode}
      ORDER BY views DESC
    `;

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      regionCode,
      count: videos.length,
      videos
    });
  } catch (error) {
    console.error("videos API error:", error);
    return res.status(500).json({ error: "Failed to fetch videos" });
  }
}
