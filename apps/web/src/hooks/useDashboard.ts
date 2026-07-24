import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dashboardApi,
  type GardenSummaryCard,
  type RecommendationItem,
} from '../services/api';
import type { DashboardPlant } from '../utils/dashboard';
import type { SharedPlantView } from '../utils/household';
import type { TaskItem } from '../utils/taskGroups';
import { formatApiErrorMessage } from '../utils/apiError';

export interface DashboardAttention {
  plantId: string;
  plantName: string;
  reason: string;
  priority: 'urgent' | 'warning' | 'info';
}

export interface DashboardWeekDay {
  date: string;
  label: string;
  dateLabel: string;
  count: number;
}

export interface DashboardWeekSummary {
  status: 'calm' | 'light' | 'busy';
  headline: string;
  body: string;
  actionLabel: string;
  actionTo: string;
  busiestDay: DashboardWeekDay | null;
  counts: {
    totalTasks: number;
    activeDays: number;
    busiestDayCount: number;
  };
}

export interface DashboardScheduleSuggestion {
  id: string;
  plantId: string;
  plantName: string;
  taskType: string;
  title: string;
  explanation: string;
  adjustmentDays: number;
  affectedTaskCount: number;
  confidence: 'low' | 'medium' | 'high';
  reversible: boolean;
}

export interface DashboardCareSummary {
  status: 'empty' | 'overdue' | 'due_today' | 'health_attention' | 'progress' | 'calm';
  headline: string;
  body: string;
  actionLabel: string;
  actionTo: string;
  focusPlantId: string | null;
  focusPlantName: string | null;
  counts: {
    overdue: number;
    dueToday: number;
    completedToday: number;
    pending: number;
    openDiagnoses: number;
  };
}

export interface DashboardAttentionSummary {
  status: 'urgent' | 'warning' | 'info' | 'calm';
  headline: string;
  body: string;
  counts: {
    urgent: number;
    warning: number;
    info: number;
    needsAttention: number;
    total: number;
  };
}

export interface DashboardHealthStory {
  openDiagnosisCount: number;
  recentJournal: Array<{
    id: string;
    plantId: string;
    plantName: string;
    createdAt: string;
    notePreview: string | null;
    photoUrl: string | null;
    measurements: {
      heightCm: number | null;
      widthCm: number | null;
      leafCount: number | null;
    };
  }>;
  recentDiagnoses: Array<{
    id: string;
    plantId: string;
    plantName: string;
    resultLabel: string;
    confidence: number | null;
    resolved: boolean;
    createdAt: string;
  }>;
  recoveryPlants: Array<{
    diagnosisId: string;
    plantId: string;
    plantName: string;
    resultLabel: string;
    createdAt: string;
    actionTo: string;
  }>;
}

export interface DashboardPayload {
  greeting: { name: string; dateLabel: string; statusLine: string };
  metrics: {
    totalPlants: number;
    dueToday: number;
    overdue: number;
    completedToday: number;
    gardenScore: number;
  };
  plants: DashboardPlant[];
  sharedPlants: SharedPlantView[];
  gardenSummaries: GardenSummaryCard[];
  careSummary?: DashboardCareSummary;
  pendingTasks: TaskItem[];
  todayTasks: TaskItem[];
  attention: DashboardAttention[];
  attentionSummary?: DashboardAttentionSummary;
  weekPreview: DashboardWeekDay[];
  weekSummary?: DashboardWeekSummary;
  scheduleSuggestions: DashboardScheduleSuggestion[];
  recommendations: RecommendationItem[];
  healthStory?: DashboardHealthStory;
  weather: {
    hasLocation: boolean;
    locationLabel?: string | null;
    canFetchToday?: boolean;
    cachedSummary: string | null;
  };
  engagement: {
    score: number;
    streak: number;
    completedInRange: number;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      emoji: string;
      unlocked: boolean;
      unlockedAt: string | null;
      progressLabel?: string;
    }>;
  };
}

export function useDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    setError('');
    setLoading(true);

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await dashboardApi.get(
            undefined,
            undefined,
            controller.signal,
          );
          if (sequence === requestSequence.current) setData(response.data);
          return;
        } catch (caught) {
          if (controller.signal.aborted || axios.isCancel(caught)) return;
          const transient =
            axios.isAxiosError(caught) &&
            (!caught.response || caught.response.status >= 500);
          if (attempt === 0 && transient) continue;
          if (sequence === requestSequence.current) {
            setError(
              formatApiErrorMessage(
                caught,
                'Could not load your dashboard.',
              ),
            );
          }
          return;
        }
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => activeController.current?.abort();
  }, [load]);

  return { data, loading, error, reload: load };
}
