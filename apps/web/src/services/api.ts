import axios from 'axios';
import type {
  BuddyCompanionMode,
  BuddyState,
  BuddyTrait,
  JourneyResponse,
} from '../hooks/buddy/types';
import { trackEvent } from '../utils/analytics';
import type { TaskCompleteFeedback, TaskSkipFeedback } from '../utils/taskFeedback';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

/** Public auth routes — no Bearer token (avoids refresh loops on forgot-password). */
function isPublicAuthPath(url?: string) {
  const path = url?.split('?')[0] ?? '';
  return (
    path === '/auth/register' ||
    path === '/auth/login' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    path === '/auth/resend-verification' ||
    path === '/auth/refresh' ||
    path === '/auth/verify-email' ||
    path.startsWith('/auth/verify-email/')
  );
}

api.interceptors.request.use((config) => {
  if (isPublicAuthPath(config.url)) {
    config.headers.delete('Authorization');
    (config as { skipAuthRefresh?: boolean }).skipAuthRefresh = true;
  } else {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData needs a multipart boundary; a preset Content-Type breaks uploads and fields.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !(error.config as { skipAuthRefresh?: boolean })?.skipAuthRefresh) {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post(`${apiBaseURL}/auth/refresh`, { refreshToken: refresh });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  verifyEmail: (token: string) => api.post(`/auth/verify-email/${token}`),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }, { timeout: 30_000, skipAuthRefresh: true }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }, { skipAuthRefresh: true }),
};

export const adminApi = {
  listPending: () => api.get('/admin/registrations/pending'),
  listUsers: () => api.get('/admin/registrations/users'),
  approve: (userId: string) => api.post(`/admin/registrations/${userId}/approve`),
  reject: (userId: string) => api.post(`/admin/registrations/${userId}/reject`),
  disable: (userId: string) => api.post(`/admin/registrations/${userId}/disable`),
  unpauseAi: (userId: string) => api.post(`/admin/registrations/${userId}/ai/unpause`),
};

export const plantsApi = {
  list: () => api.get('/plants'),
  get: (id: string) => api.get(`/plants/${id}`),
  timeline: (id: string) => api.get(`/plants/${id}/timeline`),
  update: (
    id: string,
    data: {
      nickname?: string;
      location?: string;
      potSize?: string;
      notes?: string;
      imageUrl?: string | null;
    },
  ) => api.patch(`/plants/${id}`, data),
  create: (data: Record<string, unknown>) => api.post('/plants', data),
  delete: (id: string) => api.delete(`/plants/${id}`),
  identify: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/plants/identify', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  upload: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/plants/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const speciesApi = {
  search: (q: string, filters?: Record<string, boolean>) =>
    api.get('/species/search', { params: { q, ...filters } }),
  browse: (params: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    beginnerFriendly?: string;
    petSafe?: string;
    lowLight?: string;
    succulent?: string;
    edible?: string;
    droughtTolerant?: string;
    indoor?: string;
    outdoor?: string;
    highHumidity?: string;
    pollinatorFriendly?: string;
    bloomsIndoors?: string;
  }) => api.get('/species/browse', { params }),
  get: (id: string) => api.get(`/species/${id}`),
  recommended: (limit = 12) =>
    api.get('/species/recommended', { params: { limit } }),
};

export const dashboardApi = {
  get: (from?: string, to?: string) =>
    api.get('/dashboard', { params: { from, to } }),
};

export const weatherApi = {
  adviceStatus: () =>
    api.get<{
      hasLocation: boolean;
      canFetchToday: boolean;
      fetchedAt: string | null;
      nextAvailableAt: string | null;
      locationLabel: string | null;
      cachedAdvice: {
        summary?: { days?: { date: string; tempMinC: number; tempMaxC: number; rainProbability: number }[] };
      } | null;
    }>('/users/me/weather/advice/status'),
  fetchAdvice: (confirmed = true) =>
    api.post('/users/me/weather/advice', { confirmed }),
  searchLocations: (q: string) =>
    api.get<{ name: string; latitude: number; longitude: number; country: string }[]>(
      '/users/me/weather/locations',
      { params: { q } },
    ),
};

export const tasksApi = {
  list: (from?: string, to?: string) => api.get('/tasks', { params: { from, to } }),
  scheduleSuggestions: () => api.get('/tasks/schedule-suggestions'),
  applyScheduleSuggestion: (suggestionId: string) =>
    api.post(`/tasks/schedule-suggestions/${encodeURIComponent(suggestionId)}/apply`),
  complete: (id: string, feedback?: TaskCompleteFeedback) =>
    api.patch(`/tasks/${id}/complete`, feedback ?? {}),
  skip: (id: string, feedback?: TaskSkipFeedback) => api.patch(`/tasks/${id}/skip`, feedback ?? {}),
  snooze: (id: string, days: 1 | 3 | 7) => api.patch(`/tasks/${id}/snooze`, { days }),
  instructions: (id: string) => api.get(`/tasks/${id}/instructions`),
  explanation: (id: string) => api.get(`/tasks/${id}/explanation`),
};

export interface JournalPayload {
  notes?: string;
  heightCm?: number;
  widthCm?: number;
  leafCount?: number;
}

export const journalApi = {
  list: (plantId: string) => api.get(`/plants/${plantId}/journal`),
  create: (plantId: string, payload: JournalPayload, photo?: File) => {
    const form = new FormData();
    if (payload.notes) form.append('notes', payload.notes);
    if (payload.heightCm != null) form.append('heightCm', String(payload.heightCm));
    if (payload.widthCm != null) form.append('widthCm', String(payload.widthCm));
    if (payload.leafCount != null) form.append('leafCount', String(payload.leafCount));
    if (photo) form.append('photo', photo);
    return api.post(`/plants/${plantId}/journal`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (
    plantId: string,
    entryId: string,
    payload: JournalPayload,
    photo?: File,
    removePhoto?: boolean,
  ) => {
    const form = new FormData();
    if (payload.notes !== undefined) form.append('notes', payload.notes);
    if (payload.heightCm != null) form.append('heightCm', String(payload.heightCm));
    if (payload.widthCm != null) form.append('widthCm', String(payload.widthCm));
    if (payload.leafCount != null) form.append('leafCount', String(payload.leafCount));
    if (photo) form.append('photo', photo);
    if (removePhoto) form.append('removePhoto', 'true');
    return api.patch(`/plants/${plantId}/journal/${entryId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (plantId: string, entryId: string) =>
    api.delete(`/plants/${plantId}/journal/${entryId}`),
};

export const diagnosisApi = {
  submit: (
    plantId: string,
    payload: {
      symptomsText?: string;
      symptomDuration?: 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS';
      recentCareChange?: 'NONE' | 'WATERING' | 'LIGHT' | 'REPOT' | 'FERTILIZER' | 'TEMPERATURE' | 'PEST_TREATMENT';
      pestsVisible?: boolean;
    },
    image?: File,
  ) => {
    const form = new FormData();
    if (payload.symptomsText) form.append('symptomsText', payload.symptomsText);
    if (payload.symptomDuration) form.append('symptomDuration', payload.symptomDuration);
    if (payload.recentCareChange) form.append('recentCareChange', payload.recentCareChange);
    if (payload.pestsVisible != null) form.append('pestsVisible', String(payload.pestsVisible));
    if (image) form.append('image', image);
    return api.post(`/plants/${plantId}/diagnose`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStatus: (plantId: string, diagnosisId: string, resolved: boolean) =>
    api.patch(`/plants/${plantId}/diagnose/${diagnosisId}`, { resolved }),
  createFollowUpTask: (
    plantId: string,
    diagnosisId: string,
    dueInDays = 3,
    note?: string,
  ) =>
    api.post(`/plants/${plantId}/diagnose/${diagnosisId}/follow-up-task`, {
      dueInDays,
      note,
    }),
  getRecoverySuggestions: (plantId: string, diagnosisId: string) =>
    api.get<
      {
        key: string;
        label: string;
        taskType: string;
        dueInDays: number;
        alreadyScheduled: boolean;
      }[]
    >(`/plants/${plantId}/diagnose/${diagnosisId}/recovery-suggestions`),
  applyRecoveryTasks: (plantId: string, diagnosisId: string, keys: string[]) =>
    api.post(`/plants/${plantId}/diagnose/${diagnosisId}/recovery-tasks`, { keys }),
};

export const diagnosisChatApi = {
  list: (plantId: string) =>
    api.get(`/plants/${plantId}/diagnose/conversations`),
  get: (plantId: string, conversationId: string) =>
    api.get(`/plants/${plantId}/diagnose/conversations/${conversationId}`),
  create: (plantId: string, message?: string, image?: File) => {
    const form = new FormData();
    if (message) form.append('message', message);
    if (image) form.append('image', image);
    return api.post(`/plants/${plantId}/diagnose/conversations`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  sendMessage: (plantId: string, conversationId: string, message?: string, image?: File) => {
    const form = new FormData();
    if (message) form.append('message', message);
    if (image) form.append('image', image);
    return api.post(
      `/plants/${plantId}/diagnose/conversations/${conversationId}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  saveJournalNote: (plantId: string, conversationId: string, messageId: string, note?: string) =>
    api.post(`/plants/${plantId}/diagnose/conversations/${conversationId}/actions/journal-note`, {
      messageId,
      note,
    }),
  scheduleHealthCheck: (
    plantId: string,
    conversationId: string,
    messageId: string,
    dueInDays = 3,
    note?: string,
  ) =>
    api.post(`/plants/${plantId}/diagnose/conversations/${conversationId}/actions/health-check`, {
      messageId,
      dueInDays,
      note,
    }),
};

export const usersApi = {
  me: () => api.get('/users/me'),
  updateCarePreferences: (data: {
    experienceLevel?: string;
    defaultLightLevel?: string;
  }) => api.put('/users/me/care-preferences', data),
  updateSettings: (data: Record<string, unknown>) =>
    api.put('/users/me/notification-settings', data),
  deleteAccount: () => api.delete('/users/me'),
  weatherAdviceStatus: () => api.get('/users/me/weather/advice/status'),
  fetchWeatherAdvice: () => api.post('/users/me/weather/advice', { confirmed: true }),
  searchWeatherLocations: (q: string) =>
    api.get('/users/me/weather/locations', { params: { q } }),
};

export const billingApi = {
  checkout: () => api.post('/billing/checkout'),
  status: () => api.get('/billing/status'),
  portal: () => api.post('/billing/portal'),
};

export const devicesApi = {
  register: (token: string, platform: string) =>
    api.post('/devices', { token, platform }),
  unregister: (token: string) => api.delete('/devices', { data: { token } }),
};

export interface GardenMemberSummary {
  id: string;
  userId: string;
  role: string;
  user?: { id: string; name?: string | null; email: string };
}

export interface PlantShareSummary {
  id: string;
  plantId: string;
  canComplete: boolean;
  canJournal: boolean;
  plant: {
    id: string;
    userId: string;
    nickname?: string | null;
    location?: string | null;
    imageUrl?: string | null;
    species: {
      commonName: string;
      scientificName?: string | null;
      sunlight?: string | null;
      wateringFreqDays: number;
      defaultImageUrl?: string | null;
    };
  };
}

export interface GardenSummary {
  id: string;
  name: string;
  /** Temporary backing field for garden environment; expected values are Indoor/Outdoor. */
  location?: string | null;
  ownerId: string;
  members: GardenMemberSummary[];
  plants: PlantShareSummary[];
  _count?: { invites: number; activity: number };
}

/** Garden Dashboard detail (GET /gardens/:id). */
export interface GardenDetailPlant {
  id: string;
  nickname?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  species: { commonName: string; scientificName?: string | null };
  needsAttention: boolean;
  nextTask?: { taskType: string; dueDate: string } | null;
}
export interface GardenDetail {
  id: string;
  name: string;
  /** Temporary backing field for garden environment; expected values are Indoor/Outdoor. */
  location: string | null;
  isOwner: boolean;
  members: GardenMemberSummary[];
  taskSummary: { dueToday: number; overdue: number; upcoming: number };
  nextWatering: string | null;
  notesCount: number;
  plants: GardenDetailPlant[];
  tasks: TaskItemSummary[];
}

/** TaskItem-shaped pending task (matches the web TaskItem used by TaskRow). */
export interface TaskItemSummary {
  id: string;
  taskType: string;
  dueDate: string;
  status: string;
  completedAt?: string | null;
  plant: {
    id: string;
    nickname?: string | null;
    imageUrl?: string | null;
    species: { commonName: string };
  };
}

/** Landing/My-Gardens summary card (GET /gardens/summaries). */
export interface GardenSummaryCard {
  id: string;
  name: string;
  /** Temporary backing field for garden environment; expected values are Indoor/Outdoor. */
  location: string | null;
  isOwner: boolean;
  plantCount: number;
  memberCount: number;
  tasksDueToday: number;
  overdue: number;
  urgentAlerts: number;
  status: string;
}

export interface ActivityEventSummary {
  id: string;
  type: string;
  payload: string;
  createdAt: string;
  actor?: { id: string; name?: string | null; email: string };
}

export interface CommunityPostSummary {
  id: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  author?: { id: string; name?: string | null; email?: string };
  species?: { id: string; commonName: string } | null;
  _count?: { comments: number; likes: number };
  likedByMe?: boolean;
}

export interface CommunityCommentSummary {
  id: string;
  body: string;
  createdAt: string;
  postId: string;
  author?: { id: string; name?: string | null; email?: string };
}

export interface GardenInviteSummary {
  id: string;
  email: string | null;
  role: 'CAREGIVER' | 'VIEWER';
  token: string;
  expiresAt: string;
  createdAt: string;
}

export const gardensApi = {
  create: (name: string, environment: 'Indoor' | 'Outdoor' = 'Indoor') =>
    api.post<GardenSummary>('/gardens', { name, location: environment }),
  mine: () => api.get<GardenSummary[]>('/gardens/mine'),
  summaries: () => api.get<GardenSummaryCard[]>('/gardens/summaries'),
  detail: (gardenId: string) => api.get<GardenDetail>(`/gardens/${gardenId}`),
  createInvite: (gardenId: string, data: { email?: string; role: 'CAREGIVER' | 'VIEWER' }) =>
    api.post<{ token: string; emailSent?: boolean }>(`/gardens/${gardenId}/invites`, data),
  listInvites: (gardenId: string) =>
    api.get<GardenInviteSummary[]>(`/gardens/${gardenId}/invites`),
  removeMember: (gardenId: string, memberUserId: string) =>
    api.delete(`/gardens/${gardenId}/members/${memberUserId}`),
  acceptInvite: (token: string) => api.post('/gardens/invites/accept', { token }),
  sharePlant: (
    gardenId: string,
    data: { plantId: string; canComplete?: boolean; canJournal?: boolean },
  ) => api.post(`/gardens/${gardenId}/plants`, data),
  activity: (gardenId: string) => api.get<ActivityEventSummary[]>(`/gardens/${gardenId}/activity`),
};

export const buddyApi = {
  create: async (data: { name: string; speciesId: string; trait: BuddyTrait }) => {
    const res = await api.post<BuddyState>('/buddy', data);
    trackEvent('BuddyCreated', { speciesId: data.speciesId, trait: data.trait });
    return res;
  },
  get: () => api.get<BuddyState>('/buddy'),
  update: (data: {
    name?: string;
    trait?: BuddyTrait;
    speciesId?: string;
    equippedItems?: Record<string, unknown>;
    terrariumLayout?: Record<string, unknown>;
    terrariumBackground?: string;
    floatingCompanionMode?: BuddyCompanionMode;
  }) => api.patch<BuddyState>('/buddy', data),
  shopCatalog: () => api.get('/buddy/shop/catalog'),
  shopDaily: () => api.get('/buddy/shop/daily'),
  shopInventory: () => api.get('/buddy/shop/inventory'),
  shopPurchase: async (itemId: string) => {
    const res = await api.post('/buddy/shop/purchase', { itemId });
    trackEvent('BuddyShopPurchase', { itemId });
    return res;
  },
  listSpecies: () => api.get('/buddy/species'),
  greeting: () => api.get<{ message: string; weatherAware?: boolean }>('/buddy/greeting'),
  seasonalStatus: () =>
    api.get<{
      active: boolean;
      event?: {
        id: string;
        title: string;
        description: string;
        emoji: string;
        shopItemIds: string[];
      };
      items?: { id: string; name: string; cost: number; bloomTokenCost: number }[];
    }>('/buddy/seasonal'),
  companionLine: () => api.get<{ message: string; source: string }>('/buddy/companion-line'),
  getJourney: () => api.get<JourneyResponse>('/buddy/journey'),
  startJourney: async (biomeId?: string) => {
    const res = await api.post<{ journey: JourneyResponse['journey']; estimatedMinutes: number }>(
      '/buddy/journey/start',
      biomeId ? { biomeId } : {},
    );
    trackEvent('BuddyJourneyStarted', { biomeId: biomeId ?? res.data.journey?.biomeId });
    return res;
  },
  respondDiscovery: (journeyId: string, choice: number) =>
    api.post('/buddy/journey/respond', { journeyId, choice }),
  activityLibrary: () =>
    api.get<
      {
        activityType: string;
        label: string;
        emoji: string;
        estimatedMinutes: number;
        sunlightReward: number;
        dewdropReward: number;
      }[]
    >('/buddy/activities'),
  completeActivity: async (data: {
    activityType: string;
    plantId?: string;
    plantIds?: string[];
    notes?: string;
    durationSeconds?: number;
  }) => {
    const res = await api.post<{
      activity: {
        id: string;
        activityType: string;
        sunlightEarned: number;
        dewdropsEarned: number;
        tasksCompleted: number;
        completedAt: string;
      };
      buddy: BuddyState | null;
    }>('/buddy/activities/complete', data);
    trackEvent('BuddyActivityCompleted', {
      activityType: data.activityType,
      tasksCompleted: res.data.activity.tasksCompleted,
    });
    return res;
  },
  getQuests: () => api.get('/buddy/quests'),
  claimQuest: async (questId: string) => {
    const res = await api.post(`/buddy/quests/${questId}/claim`);
    trackEvent('BuddyQuestClaimed', { questId });
    return res;
  },
  listFriends: () => api.get('/buddy/social/friends'),
  addFriend: (gardenCode: string) =>
    api.post('/buddy/social/friends/add', { gardenCode }),
  removeFriend: (friendBuddyId: string) =>
    api.delete(`/buddy/social/friends/${friendBuddyId}`),
  sendSunshine: (friendBuddyId: string) =>
    api.post(`/buddy/social/sunshine/${friendBuddyId}`),
  sunshineToday: () => api.get<{ sent: string[]; received: number }>('/buddy/social/sunshine/today'),
  viewFriendTerrarium: (friendBuddyId: string) =>
    api.get(`/buddy/social/friends/${friendBuddyId}/terrarium`),
  socialFeed: () => api.get('/buddy/social/feed'),
};

export type CommunityPostsPage = {
  posts: CommunityPostSummary[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const communityApi = {
  listPosts: (params?: { limit?: number; cursor?: string }) =>
    api.get<CommunityPostsPage>('/community/posts', {
      params: { limit: params?.limit ?? 20, cursor: params?.cursor },
    }),
  createPost: (data: { body: string; speciesId?: string; imageUrl?: string }) =>
    api.post<CommunityPostSummary>('/community/posts', data),
  deletePost: (postId: string) => api.delete(`/community/posts/${postId}`),
  listComments: (postId: string) =>
    api.get<CommunityCommentSummary[]>(`/community/posts/${postId}/comments`),
  createComment: (postId: string, body: string) =>
    api.post<CommunityCommentSummary>(`/community/posts/${postId}/comments`, { body }),
  deleteComment: (commentId: string) => api.delete(`/community/comments/${commentId}`),
  toggleLike: (postId: string) =>
    api.post<{ liked: boolean; likeCount: number }>(`/community/posts/${postId}/like`),
};

export default api;
