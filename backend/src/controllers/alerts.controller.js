const { executeTrinoQuery } = require('../services/trino.service');

/**
 * Lấy danh sách Alert thời gian thực từ bảng Bronze
 * Sử dụng incident_id làm ID
 */
const getBronzeAlerts = async (req, res) => {
  try {
    const query = `
      SELECT 
        incident_id, camera_id, timestamp, risk_score, is_violent, frame_url, location
      FROM paimon.security.violence_incidents
      WHERE is_deleted = false
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    const rawData = await executeTrinoQuery(query);

    const alerts = rawData.map(row => ({
      event_id: row[0],     
      camera_id: row[1],    
      timestamp: row[2],    
      score: row[3] ? parseFloat(row[3]) : 0, 
      label: parseFloat(row[3]) >= 0.65 ? 'Violence' : 'Normal',        
      is_violent: row[4],   
      frame_url: row[5],
      ward: row[6]
    }));

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bronze alerts' });
  }
};

/**
 * Xóa một sự kiện khỏi database dựa trên incident_id
 */
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Event ID (incident_id) is required' });
    }

    const query = `UPDATE paimon.security.violence_incidents SET is_deleted = true WHERE incident_id = '${id}'`;
    
    await executeTrinoQuery(query);

    res.json({ 
      message: 'Event marked as deleted in Paimon layer',
      event_id: id 
    });
  } catch (err) {
    console.error('Delete Alert Error:', err.message);
    res.status(500).json({ 
      error: 'Delete failed'
    });
  }
};

/**
 * Logic cho trang Dashboard chính (Sessionized incidents view)
 */
const getLiveAlerts = async (req, res) => {
  try {
    const query = `
      SELECT 
        incident_id, camera_id, location, timestamp, frame_url, risk_score
      FROM iceberg.default.violence_incidents_sessionized
      WHERE is_violent = true AND is_deleted = false
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    const rawData = await executeTrinoQuery(query);
    const alerts = rawData.map(row => ({
      event_id: row[0],
      location: `${row[1]} - ${row[2]}`, 
      timestamp: row[3], 
      frame_url: row[4] || 'https://via.placeholder.com/640x360?text=No+Evidence',
      label: 'Violence Detected',
      violence_score: parseFloat(row[5]).toFixed(4), 
      status: 'Unreviewed'
    }));

    res.json(alerts);
  } catch (err) {
    console.error('Live Alerts Error:', err.message);
    res.status(500).json({ error: 'Live alerts query failed' });
  }
};

module.exports = { 
  getLiveAlerts, 
  getBronzeAlerts, 
  deleteAlert 
};