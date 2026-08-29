const REGIONS = [
  "JP",
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "IT",
  "ES",
  "BR",
  "MX",
  "KR",
  "IN",
  "ID",
  "PH",
  "TH",
  "VN",
  "TW"
];

export default async function handler(req, res) {
  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const results = [];

    for (const regionCode of REGIONS) {
      try {
        const response = await fetch(
          `${baseUrl}/api/youtube?regionCode=${regionCode}`
        );

        const data = await response.json();

        results.push({
          regionCode,
          success: response.ok,
          status: response.status,
          fetched: data.fetched || 0,
          saved: data.saved || 0,
          error: data.error || null
        });
      } catch (error) {
        results.push({
          regionCode,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(
      (result) => result.success
    ).length;

    return res.status(200).json({
      success: successful === REGIONS.length,
      totalRegions: REGIONS.length,
      successful,
      failed: REGIONS.length - successful,
      results
    });
  } catch (error) {
    console.error("update-all error:", error);

    return res.status(500).json({
      error: "Failed to update all regions"
    });
  }
}
