export default async function handler(req, res) {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: "Twitch API credentials are not configured"
      });
    }

    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
      })
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error("Twitch token error:", tokenError);

      return res.status(502).json({
        error: "Failed to authenticate with Twitch"
      });
    }

    const tokenData = await tokenResponse.json();

    const streamsResponse = await fetch("https://api.twitch.tv/helix/streams?first=50", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Client-Id": clientId
      }
    });

    if (!streamsResponse.ok) {
      const streamsError = await streamsResponse.text();
      console.error("Twitch streams error:", streamsError);

      return res.status(502).json({
        error: "Failed to fetch Twitch live streams"
      });
    }

    const streamsData = await streamsResponse.json();
    const streams = Array.isArray(streamsData.data) ? streamsData.data : [];
    const stream = streams.length > 0
      ? streams[Math.floor(Math.random() * streams.length)]
      : null;

    return res.status(200).json({
      live: Boolean(stream),
      stream
    });
  } catch (error) {
    console.error("Twitch API error:", error);

    return res.status(500).json({
      error: "Failed to connect to Twitch API"
    });
  }
}
