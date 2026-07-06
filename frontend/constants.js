import { Video, BarChart2, Bell, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Live Streams', icon: Video },
  { name: 'Alerts Dashboard', icon: Bell },
  { name: 'Analytics', icon: BarChart2 },
  { name: 'Chatbot', icon: MessageSquare },
  { name: 'Settings', icon: SettingsIcon },
];

// Real RTSP cameras from camera_registry.csv — matched to MediaMTX stream paths & Kafka cam_id
export const CAMERA_REGISTRY = [
  { id: 'cam_01', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé',         specificLocation: 'Đường Nguyễn Huệ',      status: 'NORMAL', streamPath: 'cam_01' },
  { id: 'cam_02', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Nguyễn Thái Bình', specificLocation: 'Đường Lê Lợi',          status: 'NORMAL', streamPath: 'cam_02' },
  { id: 'cam_03', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Thành',        specificLocation: 'Đường Nguyễn Thái Học', status: 'NORMAL', streamPath: 'cam_03' },
  { id: 'cam_04', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Cầu Ông Lãnh',    specificLocation: 'Đường Lê Thánh Tôn',    status: 'NORMAL', streamPath: 'cam_04' },
  { id: 'cam_05', city: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Phạm Ngũ Lão',    specificLocation: 'Đường Pasteur',         status: 'NORMAL', streamPath: 'cam_05' },
];

// Backward compat alias — LiveStreams.jsx imports MOCK_CAMERAS
export const MOCK_CAMERAS = CAMERA_REGISTRY;

export const API_BASE_URL = "http://localhost:5000/api";