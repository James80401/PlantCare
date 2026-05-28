import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import type { DashboardPlant } from '../utils/dashboard';
import type { SharedPlantView } from '../utils/household';
import type { TaskItem } from '../utils/taskGroups';

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
  pendingTasks: TaskItem[];
  todayTasks: TaskItem[];
  attention: DashboardAttention[];
  weekPreview: DashboardWeekDay[];
  scheduleSuggestions: DashboardScheduleSuggestion[];
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

  const load = useCallback(() => {
    setError('');
    return dashboardApi
      .get()
      .then((r) => setData(r.data))
      .catch(() => setError('Could not load your dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
