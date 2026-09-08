module.exports = async function handler(req, res) {
    const { platform, username } = req.query;

    if (!username || typeof username !== 'string' || !username.trim()) {
          res.status(400).json({ success: false, error: 'Missing username.' });
          return;
    }

    const plat = (platform || 'instagram').toLowerCase();
    if (plat !== 'instagram') {
          res.status(400).json({ success: false, error: 'Auto-lookup currently only supports Instagram.' });
          return;
    }

    const clientId = process.env.SOCIALBLADE_CLIENT_ID;
    const token = process.env.SOCIALBLADE_TOKEN;

    if (!clientId || !token) {
          res.status(500).json({ success: false, error: 'Lookup is not configured yet. Enter your numbers manually.' });
          return;
    }
    try {
          const cleanUsername = username.trim().replace(/^@/, '');
          const url = 'https://matrix.sbapis.com/b/instagram/statistics?query=' + encodeURIComponent(cleanUsername);

      const sbRes = await fetch(url, {
              headers: {
                        clientid: clientId,
                        token: token
              }
      });

      const data = await sbRes.json();

  if (!data || !data.status || !data.status.success || !data.data || !data.data.statistics || !data.data.statistics.total) {
    res.status(404).json({ success: false, error: "Couldn't find that profile - check the username, or it may be private." });
    return;
  }

  const stats = data.data.statistics.total;

  if (typeof stats.followers !== 'number' || typeof stats.engagement_rate !== 'number') {
    res.status(404).json({ success: false, error: 'No usable stats for this profile yet.' });
    return;
  }

  res.status(200).json({
    success: true,
    followers: stats.followers,
    engagement_rate: stats.engagement_rate
  });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Lookup failed - try again or enter your numbers manually.' });
    }
}
