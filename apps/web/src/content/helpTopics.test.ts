import { describe, expect, it } from 'vitest';
import { HELP_TOPICS } from './helpTopics';

const REQUIRED_TOPICS = [
  'dashboard',
  'gardens-list',
  'garden-detail',
  'garden-plants',
  'garden-members',
  'household',
  'plant-overview',
  'plant-care',
  'plant-tasks',
  'plant-journal',
  'plant-health',
  'tasks',
  'calendar',
  'add-plant',
  'settings',
  'subscription',
  'community',
  'browse-species',
  'species-detail',
  'buddy',
] as const;

const MAX_TIPS = 4;
const MAX_TIP_LENGTH = 160;

describe('HELP_TOPICS', () => {
  it('has content for every required topic', () => {
    for (const key of REQUIRED_TOPICS) {
      expect(HELP_TOPICS[key], `missing help topic: ${key}`).toBeDefined();
    }
  });

  it('keeps every topic short and skimmable, not cumbersome', () => {
    for (const [key, topic] of Object.entries(HELP_TOPICS)) {
      expect(topic.title.length, `${key} title is empty`).toBeGreaterThan(0);
      expect(topic.tips.length, `${key} has no tips`).toBeGreaterThan(0);
      expect(topic.tips.length, `${key} has too many tips`).toBeLessThanOrEqual(MAX_TIPS);
      for (const tip of topic.tips) {
        expect(tip.length, `${key} tip too long: "${tip}"`).toBeLessThanOrEqual(MAX_TIP_LENGTH);
      }
    }
  });
});
