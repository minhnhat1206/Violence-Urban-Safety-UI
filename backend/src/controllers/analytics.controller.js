const { executeTrinoQuery } = require('../services/trino.service');

const getAnalyticsData = async (req, res) => {
  try {
    const query = `
      SELECT 
        timestamp, location, camera_id, is_violent, risk_score
      FROM paimon.security.violence_incidents
      WHERE is_deleted = false
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    const rawData = await executeTrinoQuery(query);

    // Map dữ liệu cho Frontend Recharts
    const analyticsData = rawData.map(row => ({
      timestamp: row[0],
      district: 'Hồ Chí Minh',
      ward: row[1] || 'Unknown',
      camera_id: row[2],
      is_violent: row[3],
      risk_score: row[4] ? parseFloat(row[4]) : 0,
      duration: 10,  // static duration for charts
      fps: 15,       // static FPS
      latency: 800,  // static latency
      alert_count: 1
    }));

    res.json(analyticsData);

  } catch (err) {
    console.error('Analytics Controller Error:', err.message);
    res.status(500).json({ error: 'Analytics Query failed' });
  }
};

module.exports = { getAnalyticsData };