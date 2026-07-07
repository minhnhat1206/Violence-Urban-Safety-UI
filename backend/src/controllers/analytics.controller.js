const { executeTrinoQuery } = require('../services/trino.service');

/**
 * Analytics — star schema v2: fact_violence_incident (grain = 1 VỤ, đã sessionize)
 * join dim_camera SCD2. alert_count = event_count (số event thô trong vụ).
 */
const getAnalyticsData = async (req, res) => {
  try {
    const query = `
      SELECT
        CAST(f.start_ts AS VARCHAR) AS start_ts, c.district, c.ward, f.camera_id,
        f.is_violent, f.max_risk_score, f.duration_sec,
        f.people_count, f.avg_confidence, f.event_count
      FROM paimon.security.fact_violence_incident AS f
      LEFT JOIN paimon.security.dim_camera AS c
        ON f.camera_id = c.camera_id AND c.is_current = true
      ORDER BY f.start_ts DESC
      LIMIT 1000
    `;

    const rawData = await executeTrinoQuery(query);

    // Map dữ liệu cho Frontend Recharts (giữ nguyên shape v1;
    // fps/latency không thuộc fact — thay bằng people_count/avg_confidence)
    const analyticsData = rawData.map(row => ({
      timestamp: row[0],
      district: row[1] || 'Unknown',
      ward: row[2] || 'Unknown',
      camera_id: row[3],
      is_violent: row[4],
      risk_score: row[5] ? parseFloat(row[5]) : 0,
      duration: row[6] ? parseFloat(row[6]) : 0,
      fps: row[7] ? parseFloat(row[7]) : 0,        // people_count
      latency: row[8] ? parseFloat(row[8]) : 0,    // avg_confidence
      alert_count: row[9] ? parseInt(row[9]) : 0   // event_count trong vụ
    }));

    res.json(analyticsData);

  } catch (err) {
    console.error('Analytics Controller Error:', err.message);
    res.status(500).json({ error: 'Analytics Query failed' });
  }
};

module.exports = { getAnalyticsData };
