export interface ConversationListItem {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
  messages?: Array<{ role: string; content: string; createdAt: string }>;
}

export interface ChatRecoverySuggestion {
  key: string;
  label: string;
  taskType: string;
  dueInDays: number;
  alreadyScheduled: boolean;
}

export interface ChatActionDraft {
  key: string;
  kind: 'recommendation' | 'task';
  title: string;
  body: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionLabel?: string;
  actionPath?: string;
  taskType?: string;
  dueInDays?: number;
}

export interface GuidedContextQuestion {
  id: string;
  label: string;
  prompt: string;
  type: 'single' | 'text';
  options?: string[];
}

export interface GuidedContextResponse {
  title: string;
  summary: string;
  questions: GuidedContextQuestion[];
}

export const GUIDED_FOLLOW_UPS = [
  {
    label: '7-day recovery plan',
    prompt:
      'Create a simple 7-day recovery plan for this plant with what to watch, what to avoid, and when to check back.',
  },
  {
    label: 'Compare progress',
    prompt:
      'Based on the latest symptoms and photos in this thread, tell me what would count as improving, unchanged, or worse.',
  },
  {
    label: 'Care task ideas',
    prompt:
      'Suggest any care tasks I should add for this plant and explain which ones are urgent versus optional.',
  },
];

export function isOpenAiSetupError(message: string) {
  return /openai|api key|billing/i.test(message);
}
