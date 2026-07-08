import { Video, BarChart2, Bell, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Live Streams', icon: Video },
  { name: 'Alerts Dashboard', icon: Bell },
  { name: 'Analytics', icon: BarChart2 },
  { name: 'Chatbot', icon: MessageSquare },
  { name: 'Settings', icon: SettingsIcon },
];

// Real camera registry from camera_registry.csv — HCM District 1, matches sim + Kafka cam_id
export const CAMERA_REGISTRY = [
  { id: 'cam_01', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé',         specificLocation: 'Đường Nguyễn Huệ',          status: 'NORMAL', streamPath: 'cam_01' },
  { id: 'cam_02', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Nguyễn Thái Bình', specificLocation: 'Đường Lê Lợi',              status: 'NORMAL', streamPath: 'cam_02' },
  { id: 'cam_03', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Thành',        specificLocation: 'Đường Nguyễn Thái Học',     status: 'NORMAL', streamPath: 'cam_03' },
  { id: 'cam_04', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Cầu Ông Lãnh',    specificLocation: 'Đường Lê Thánh Tôn',        status: 'NORMAL', streamPath: 'cam_04' },
  { id: 'cam_05', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Phạm Ngũ Lão',    specificLocation: 'Đường Pasteur',             status: 'NORMAL', streamPath: 'cam_05' },
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