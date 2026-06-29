export const API = import.meta.env.VITE_API_BASE_URL;

export const AGENT_ICONS = {
  seo: '🔍', social_media: '📱', email: '📧', whatsapp: '💬',
  competitor: '🕵️', dynamic_pricing: '💰', analytics: '📊',
  reseller: '🤝', retention: '🔄', upsell: '⬆️',
  content_writer: '✍️', review_request: '⭐',
  video_ads: '🎬',
};

export const AGENT_NAMES = {
  seo: 'SEO Content', social_media: 'Social Media', email: 'Email Campaign',
  whatsapp: 'WhatsApp Broadcast', competitor: 'Competitor Intel',
  dynamic_pricing: 'Dynamic Pricing', analytics: 'Analytics',
  reseller: 'Reseller Recruitment', retention: 'Customer Retention',
  upsell: 'Upsell', content_writer: 'Content Writer', review_request: 'Review Request',
  video_ads: 'Video Ads',
};

export const STATUS_COLORS = {
  PENDING: '#f59e0b', RUNNING: '#3b82f6', COMPLETED: '#10b981', FAILED: '#ef4444',
};

export const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'agents', label: 'Agents' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'reports', label: 'Reports' },
  { key: 'content', label: 'Content' },
  { key: 'apiconfig', label: 'API Config' },
];

export const makeHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});
