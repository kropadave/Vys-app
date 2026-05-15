import type { ParentProduct } from '@/lib/parent-content';

export type ActivityType = ParentProduct['type'];

export const ActivityColors: Record<ActivityType, { text: string; border: string; background: string; soft: string }> = {
  Kroužek: {
    text: '#2EE7D6',
    border: 'rgba(46,231,214,0.34)',
    background: 'rgba(46,231,214,0.11)',
    soft: 'rgba(46,231,214,0.18)',
  },
  Tábor: {
    text: '#C8FF2E',
    border: 'rgba(200,255,46,0.34)',
    background: 'rgba(200,255,46,0.1)',
    soft: 'rgba(200,255,46,0.17)',
  },
  Workshop: {
    text: '#FFB21A',
    border: 'rgba(255,178,26,0.34)',
    background: 'rgba(255,178,26,0.1)',
    soft: 'rgba(255,178,26,0.18)',
  },
};

export function activityColors(type: ActivityType) {
  return ActivityColors[type];
}