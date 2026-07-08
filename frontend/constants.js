import { Video, BarChart2, Bell, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Live Streams', icon: Video },
  { name: 'Alerts Dashboard', icon: Bell },
  { name: 'Analytics', icon: BarChart2 },
  { name: 'Chatbot', icon: MessageSquare },
  { name: 'Settings', icon: SettingsIcon },
];

// Real camera registry from camera_registry.csv — HCM District 1, matches sim + Kafka cam_id
// So sánh song song 2 model trên CÙNG luồng (cam_XX_bbox → có person box):
//   *_result = StreamViD-A (sva_03, AUC 0.9029, deploy) · *_a3 = MoViNet-A3 (task1, acc 0.828)
// modelLabel hiển thị badge trên card; statusId trỏ đúng file /tmp/status_*.json qua /vio.
const _CAMS = [
  { base: 'cam_01', ward: 'Phường Bến Nghé',         specificLocation: 'Đường Nguyễn Huệ' },
  { base: 'cam_02', ward: 'Phường Nguyễn Thái Bình', specificLocation: 'Đường Lê Lợi' },
  { base: 'cam_03', ward: 'Phường Bến Thành',        specificLocation: 'Đường Nguyễn Thái Học' },
  { base: 'cam_04', ward: 'Phường Cầu Ông Lãnh',     specificLocation: 'Đường Lê Thánh Tôn' },
  { base: 'cam_05', ward: 'Phường Phạm Ngũ Lão',     specificLocation: 'Đường Pasteur' },
];

export const CAMERA_REGISTRY = [
  // 5 panel StreamViD-A (model deploy)
  ..._CAMS.map(c => ({
    id: c.base, statusId: c.base, city: 'TP. Hồ Chí Minh', district: 'Quận 1',
    ward: c.ward, specificLocation: c.specificLocation, status: 'NORMAL',
    streamPath: `${c.base}_result`, modelLabel: 'StreamViD-A', modelAccent: 'emerald',
  })),
  // 5 panel MoViNet-A3 (so sánh) — cùng scene, cùng input bbox
  ..._CAMS.map(c => ({
    id: `${c.base}_a3`, statusId: `${c.base}_a3`, city: 'TP. Hồ Chí Minh', district: 'Quận 1',
    ward: c.ward, specificLocation: c.specificLocation, status: 'NORMAL',
    streamPath: `${c.base}_a3`, modelLabel: 'MoViNet-A3', modelAccent: 'sky',
  })),
];

const generateTimestamp = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date.toISOString();
};

export const MOCK_ALERTS = [
  { event_id: 'EVT-1021', timestamp: generateTimestamp(0), location: 'Chợ An Đông', violence_score: 0.92, label: 'Fight', model_version: 'v2.1.3', clip_link: '#', status: 'Unreviewed' },
  { event_id: 'EVT-1020', timestamp: generateTimestamp(0), location: 'Chợ Bến Thành', violence_score: 0.88, label: 'Fight', model_version: 'v2.1.3', clip_link: '#', status: 'Unreviewed' },
  { event_id: 'EVT-1019', timestamp: generateTimestamp(1), location: 'Phố đi bộ Nguyễn Huệ', violence_score: 0.75, label: 'Crowd', model_version: 'v2.1.2', clip_link: '#', status: 'Reviewed' },
  { event_id: 'EVT-1018', timestamp: generateTimestamp(1), location: 'Cầu Sài Gòn', violence_score: 0.65, label: 'Anomaly', model_version: 'v2.1.3', clip_link: '#', status: 'Reviewed' },
  { event_id: 'EVT-1017', timestamp: generateTimestamp(2), location: 'Chợ An Đông', violence_score: 0.95, label: 'Fight', model_version: 'v2.1.2', clip_link: '#', status: 'False Alarm' },
  { event_id: 'EVT-1016', timestamp: generateTimestamp(2), location: 'Landmark 81', violence_score: 0.81, label: 'Crowd', model_version: 'v2.1.3', clip_link: '#', status: 'Reviewed' },
  { event_id: 'EVT-1015', timestamp: generateTimestamp(3), location: 'Phố đi bộ Nguyễn Huệ', violence_score: 0.78, label: 'Fight', model_version: 'v2.1.1', clip_link: '#', status: 'Reviewed' },
  { event_id: 'EVT-1014', timestamp: generateTimestamp(4), location: 'Cầu Ánh Sao', violence_score: 0.55, label: 'Anomaly', model_version: 'v2.1.1', clip_link: '#', status: 'Reviewed' },
  { event_id: 'EVT-1013', timestamp: generateTimestamp(5), location: 'Dinh Độc Lập', violence_score: 0.89, label: 'Fight', model_version: 'v2.1.1', clip_link: '#', status: 'False Alarm' },
  { event_id: 'EVT-1012', timestamp: generateTimestamp(6), location: 'Chợ An Đông', violence_score: 0.91, label: 'Fight', model_version: 'v2.1.1', clip_link: '#', status: 'Reviewed' },
];

export const API_BASE_URL = "/api";