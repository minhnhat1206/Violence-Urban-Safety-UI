const { executeTrinoQuery } = require('../services/trino.service');

/**
 * Danh sách alert (event grain) từ WARM — paimon.security.violence_incidents.
 * Thay bảng legacy iceberg.default.bronzeviolence (schema v1, không còn được ghi).
 */
const getBronzeAlerts = async (req, res) => {
  try {
    const query = `
      SELECT
        incident_id, camera_id, CAST("timestamp" AS VARCHAR) AS event_time,
        risk_score, event_type, is_violent, frame_url, location
      FROM paimon.security.violence_incidents
      WHERE is_violent = true
      ORDER BY "timestamp" DESC
      LIMIT 50
    `;

    const rawData = await executeTrinoQuery(query);

    const alerts = rawData.map(row => ({
      event_id: row[0],
      camera_id: row[1],
      timestamp: row[2],
      score: row[3] ? parseFloat(row[3]) : 0,
      label: row[4] || 'Violence',
      is_violent: row[5],
      frame_url: row[6],
      ward: row[7]
    }));

    res.json(alerts);
  } catch (err) {
    console.error('Bronze Alerts Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

/**
 * Ẩn một sự kiện khỏi dashboard (soft delete qua cột is_deleted).
 * Paimon qua Trino không đảm bảo hỗ trợ DELETE/UPDATE ở mọi version connector
 * → thử UPDATE, nếu connector không hỗ trợ thì trả lỗi rõ ràng.
 */
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params; // incident_id

    if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
      return res.status(400).json({ error: 'Valid event ID (incident_id) is required' });
    }

    const query = `UPDATE paimon.security.violence_incidents SET is_deleted = true WHERE incident_id = '${id}'`;

    await executeTrinoQuery(query);

    res.json({
      message: 'Event hidden successfully (is_deleted = true)',
      event_id: id
    });
  } catch (err) {
    console.error('Delete Alert Error:', err.message);
    res.status(500).json({
      error: 'Delete failed',
      details: 'Paimon-Trino connector may not support UPDATE in this version'
    });
  }
};

/**
 * Trang Dashboard chính — star schema v2: fact_violence_incident (grain = 1 VỤ)
 * join dim_camera (SCD2, is_current) + dim_event_type. frame_url là ảnh PEAK có bbox.
 */
const getLiveAlerts = async (req, res) => {
  try {
    const query = `
      SELECT
        f.incident_id, f.camera_id, c.street, c.district,
        CAST(f.start_ts AS VARCHAR) AS start_ts, f.frame_url, f.max_risk_score,
        COALESCE(et.event_code, 'UNKNOWN') AS event_type,
        f.duration_sec, f.people_count
      FROM paimon.security.fact_violence_incident AS f
      LEFT JOIN paimon.security.dim_camera AS c
        ON f.camera_id = c.camera_id AND c.is_current = true
      LEFT JOIN paimon.security.dim_event_type AS et
        ON f.event_type_id = et.event_type_id
      ORDER BY f.start_ts DESC
      LIMIT 20
    `;

    const rawData = await executeTrinoQuery(query);
    const alerts = rawData.map(row => ({
      event_id: row[0],
      location: `${row[1]} - ${row[2] || 'Unknown'}, ${row[3] || ''}`,
      timestamp: row[4],
      frame_url: row[5] || 'https://via.placeholder.com/640x360?text=No+Evidence',
      label: row[7] === 'UNKNOWN' ? 'Violence Detected' : row[7],
      violence_score: parseFloat(row[6]).toFixed(4),
      status: 'Unreviewed',
      duration_sec: row[8],
      people_count: row[9]
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
