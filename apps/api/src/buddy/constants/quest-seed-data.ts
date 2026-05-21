import { QuestType } from '@prisma/client';

export interface QuestSeed {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  requirement: Record<string, unknown>;
  rewardDewdrops: number;
  sortOrder: number;
}

export const DAILY_QUEST_POOL: QuestSeed[] = [
  {
    id: 'daily_water',
    type: 'DAILY',
    title: 'Water & Wonder',
    description: 'Complete a watering task today',
    requirement: { kind: 'TASK_TYPE', taskType: 'WATER', count: 1 },
    rewardDewdrops: 15,
    sortOrder: 1,
  },
  {
    id: 'daily_pest',
    type: 'DAILY',
    title: 'Eyes on the Leaves',
    description: 'Complete a pest inspection activity',
    requirement: { kind: 'ACTIVITY_TYPE', activityType: 'PEST_INSPECTION', count: 1 },
    rewardDewdrops: 15,
    sortOrder: 2,
  },
  {
    id: 'daily_light',
    type: 'DAILY',
    title: 'Let There Be Light',
    description: 'Complete a sunlight audit activity',
    requirement: { kind: 'ACTIVITY_TYPE', activityType: 'SUNLIGHT_AUDIT', count: 1 },
    rewardDewdrops: 12,
    sortOrder: 3,
  },
  {
    id: 'daily_journal',
    type: 'DAILY',
    title: 'Word by Word',
    description: 'Complete a plant journal activity',
    requirement: { kind: 'ACTIVITY_TYPE', activityType: 'PLANT_JOURNAL', count: 1 },
    rewardDewdrops: 20,
    sortOrder: 4,
  },
  {
    id: 'daily_sunbar',
    type: 'DAILY',
    title: 'Full Sun Day',
    description: 'Fill your sunlight bar today',
    requirement: { kind: 'SUNLIGHT_FULL', count: 1 },
    rewardDewdrops: 25,
    sortOrder: 5,
  },
  {
    id: 'daily_photo',
    type: 'DAILY',
    title: 'Snapshot',
    description: 'Complete a progress photo activity',
    requirement: { kind: 'ACTIVITY_TYPE', activityType: 'PROGRESS_PHOTO', count: 1 },
    rewardDewdrops: 12,
    sortOrder: 6,
  },
  {
    id: 'daily_journey',
    type: 'DAILY',
    title: 'First Steps',
    description: 'Send your buddy on a grow journey',
    requirement: { kind: 'JOURNEY_START', count: 1 },
    rewardDewdrops: 20,
    sortOrder: 7,
  },
  {
    id: 'daily_tasks3',
    type: 'DAILY',
    title: 'Green Thumb',
    description: 'Complete 3 care tasks today',
    requirement: { kind: 'TASKS_TODAY', count: 3 },
    rewardDewdrops: 30,
    sortOrder: 8,
  },
];

export const ACHIEVEMENT_QUESTS: QuestSeed[] = [
  {
    id: 'ach_first_journey',
    type: 'ACHIEVEMENT',
    title: 'First Leaf',
    description: 'Complete your first grow journey',
    requirement: { kind: 'JOURNEY_COMPLETE', count: 1 },
    rewardDewdrops: 20,
    sortOrder: 10,
  },
  {
    id: 'ach_journeys_10',
    type: 'ACHIEVEMENT',
    title: 'Getting Rooted',
    description: 'Complete 10 grow journeys',
    requirement: { kind: 'JOURNEY_COMPLETE', count: 10 },
    rewardDewdrops: 50,
    sortOrder: 11,
  },
  {
    id: 'ach_hydrated',
    type: 'ACHIEVEMENT',
    title: 'Hydrated',
    description: 'Complete 10 watering tasks',
    requirement: { kind: 'TASK_TYPE', taskType: 'WATER', count: 10 },
    rewardDewdrops: 30,
    sortOrder: 12,
  },
  {
    id: 'ach_journal_10',
    type: 'ACHIEVEMENT',
    title: 'Green Writer',
    description: 'Complete 10 journal activities',
    requirement: { kind: 'ACTIVITY_TYPE', activityType: 'PLANT_JOURNAL', count: 10 },
    rewardDewdrops: 50,
    sortOrder: 13,
  },
  {
    id: 'ach_streak_7',
    type: 'ACHIEVEMENT',
    title: 'Consistent',
    description: 'Reach a 7-day care streak',
    requirement: { kind: 'STREAK', count: 7 },
    rewardDewdrops: 50,
    sortOrder: 14,
  },
  {
    id: 'ach_activities_all',
    type: 'ACHIEVEMENT',
    title: 'All-Rounder',
    description: 'Try every activity type at least once',
    requirement: { kind: 'UNIQUE_ACTIVITIES', count: 10 },
    rewardDewdrops: 150,
    sortOrder: 15,
  },
];

export const MONTHLY_CHALLENGE_SEED = {
  month: 5,
  year: 2026,
  title: 'May Garden Momentum',
  description: 'Fourteen small steps to keep your plants thriving through late spring.',
  rewardDewdrops: 150,
  steps: [
    { id: 'm1', label: 'Complete a watering check activity' },
    { id: 'm2', label: 'Complete any care task' },
    { id: 'm3', label: 'Complete a humidity check activity' },
    { id: 'm4', label: 'Write a plant journal activity' },
    { id: 'm5', label: 'Take a progress photo activity' },
    { id: 'm6', label: 'Complete a pest inspection activity' },
    { id: 'm7', label: 'Complete 2 tasks in one day' },
    { id: 'm8', label: 'Complete a sunlight audit activity' },
    { id: 'm9', label: 'Send buddy on a journey' },
    { id: 'm10', label: 'Complete a pruning guide activity' },
    { id: 'm11', label: 'Fill your sunlight bar' },
    { id: 'm12', label: 'Complete a season check activity' },
    { id: 'm13', label: 'Complete any guided activity' },
    { id: 'm14', label: 'Complete 5 care tasks this month' },
  ],
};
