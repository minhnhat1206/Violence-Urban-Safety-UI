import { Video, BarChart2, Bell, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Live Streams', icon: Video },
  { name: 'Alerts Dashboard', icon: Bell },
  { name: 'Analytics', icon: BarChart2 },
  { name: 'Chatbot', icon: MessageSquare },
  { name: 'Settings', icon: SettingsIcon },
];

// Real cameras from camera_registry.csv — matches MediaMTX stream paths & Kafka cam_id
export const MOCK_CAMERAS = [
  { id: 'cam_01', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé',         specificLocation: 'Đường Nguyễn Huệ',          status: 'NORMAL', streamPath: 'cam_01' },
  { id: 'cam_02', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Nguyễn Thái Bình', specificLocation: 'Đường Lê Lợi',              status: 'NORMAL', streamPath: 'cam_02' },
  { id: 'cam_03', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Thành',        specificLocation: 'Đường Nguyễn Thái Học',     status: 'NORMAL', streamPath: 'cam_03' },
  { id: 'cam_04', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Cầu Ông Lãnh',    specificLocation: 'Đường Lê Thánh Tôn',        status: 'NORMAL', streamPath: 'cam_04' },
  { id: 'cam_05', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Phạm Ngũ Lão',    specificLocation: 'Đường Pasteur',             status: 'NORMAL', streamPath: 'cam_05' },
  { id: 'cam_06', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Tân Định',         specificLocation: 'Đường Trần Hưng Đạo',       status: 'NORMAL', streamPath: 'cam_06' },
  { id: 'cam_07', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Đa Kao',           specificLocation: 'Đường Đồng Khởi',           status: 'NORMAL', streamPath: 'cam_07' },
  { id: 'cam_08', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Thành (2)',   specificLocation: 'Đường Hai Bà Trưng',        status: 'NORMAL', streamPath: 'cam_08' },
  { id: 'cam_09', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Nguyễn Cư Trinh', specificLocation: 'Đường Nguyễn Du',           status: 'NORMAL', streamPath: 'cam_09' },
  { id: 'cam_10', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Cầu Kho',         specificLocation: 'Đường Võ Văn Kiệt',         status: 'NORMAL', streamPath: 'cam_10' },
  { id: 'cam_11', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Tân Định (2)',    specificLocation: 'Đường Nguyễn Công Trứ',     status: 'NORMAL', streamPath: 'cam_11' },
  { id: 'cam_12', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Nguyễn Thái Bình (2)', specificLocation: 'Công Trường Mê Linh', status: 'NORMAL', streamPath: 'cam_12' },
  { id: 'cam_13', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Phạm Ngũ Lão (2)',specificLocation: 'Đường Hàm Nghi',            status: 'NORMAL', streamPath: 'cam_13' },
  { id: 'cam_14', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé (2)',    specificLocation: 'Đường Nguyễn Bỉnh Khiêm',  status: 'NORMAL', streamPath: 'cam_14' },
  { id: 'cam_15', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Đa Kao (2)',      specificLocation: 'Đường Trương Định',         status: 'NORMAL', streamPath: 'cam_15' },
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

export const API_BASE_URL = "http://localhost:5000/api";