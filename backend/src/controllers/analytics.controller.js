const { executeTrinoQuery } = require('../services/trino.service');

const getAnalyticsData = async (req, res) => {
  try {
    const query = `
      SELECT 
        event_time as timestamp, 
        camera_id, 
        district, 
        ward, 
        is_violent, 
        score, 
        fps, 
        latency_ms
      FROM iceberg.default.bronzeviolence 
      ORDER BY event_time DESC 
      LIMIT 10000
    `;

    const rawData = await executeTrinoQuery(query);

    const analyticsData = rawData.map(row => {
      const isViolent = row[4] === true || row[4] === 'true';
      const rawScore = row[5] ? parseFloat(row[5]) : 0;

      return {
        timestamp: row[0],
        camera_id: row[1] || 'Unknown',
        district: row[2] || 'Unknown',
        ward: row[3] || 'Unknown',
        is_violent: isViolent,
        risk_score: isViolent ? rawScore : 0, 
        fps: row[6] ? parseFloat(row[6]) : 0,
        latency: row[7] ? parseFloat(row[7]) : 0,
        raw_score: rawScore
      };
    });

    res.json(analyticsData);

  } catch (err) {
    console.error('Analytics Bronze Controller Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
};

module.exports = { getAnalyticsData };