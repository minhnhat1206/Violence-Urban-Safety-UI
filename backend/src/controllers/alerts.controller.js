const { executeTrinoQuery } = require('../services/trino.service');

const getLiveAlerts = async (req, res) => {
  try {
    const query = `
      SELECT 
        f.fact_id, c.camera_id, l.street, l.district, 
        f.window_start, f.evidence_url, f.max_risk_score
      FROM iceberg.default.fact_camera_monitoring AS f
      LEFT JOIN iceberg.default.dim_camera AS c ON f.camera_key = c.camera_key
      LEFT JOIN iceberg.default.dim_location AS l ON f.location_key = l.location_key
      WHERE f.is_violent_window = true
      ORDER BY f.window_start DESC
      LIMIT 20
    `;

    const rawData = await executeTrinoQuery(query);

    const alerts = rawData.map(row => {
        const cameraId = row[1] || 'Unknown Cam';
        const street = row[2] || 'Unknown Street';
        const district = row[3] || '';
        const evidenceUrl = row[5];

        return {
            event_id: row[0],
            location: `${cameraId} - ${street}, ${district}`, 
            timestamp: row[4], 
            frame_url: evidenceUrl ? evidenceUrl : 'https://via.placeholder.com/640x360?text=No+Evidence',
            label: 'Violence Detected',
            violence_score: parseFloat(row[6]).toFixed(4), 
            status: 'Unreviewed',
            model_version: 'MoViNet-A3'
        };
    });

    res.json(alerts);

  } catch (err) {
    console.error('Alerts Controller Error:', err.message);
    res.status(500).json({ error: 'Alerts Query failed' });
  }
};

module.exports = { getLiveAlerts };