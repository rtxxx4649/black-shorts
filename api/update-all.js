const COUNTRIES = [
  "US", "GB", "AU", "CA", "DE", "PH",
  "ES", "FR", "KR", "IT", "VN", "TR",
  "IN", "BR", "ID", "JP", "MX", "TH"
];

export default async function handler(req, res) {
  try {
    const protocol =
      req.headers["x-forwarded-proto"] || "https";

    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const results = await Promise.all(
      COUNTRIES.map(async (regionCode) => {
        try {
          const response = await fetch(
            `${baseUrl}/api/youtube?regionCode=${regionCode}`
          );

          const data = await response.json();

          return {
            regionCode,
            success: response.ok,
            fetched: data.fetched || 0,
            saved: data.saved || 0,
            error: data.error || null
          };
        } catch (error) {
          return {
            regionCode,
            success: false,
            error: String(error)
          };
        }
      })
    );

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
    return res.status(500).json({
      error: String(error)
    });
  }
}
