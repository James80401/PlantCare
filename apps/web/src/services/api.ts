import axios from 'axios';
import type { BuddyState, BuddyTrait, JourneyResponse } from '../hooks/buddy/types';
import type { TaskSkipFeedback } from '../utils/taskFeedback';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
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
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const plantsApi = {
  list: () => api.get('/plants'),
  get: (id: string) => api.get(`/plants/${id}`),
  update: (id: string, data: { location?: string; notes?: string }) =>
    api.patch(`/plants/${id}`, data),
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
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
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
  update: (plantId: string, entryId: string, payload: JournalPayload, photo?: File) => {
    const form = new FormData();
    if (payload.notes !== undefined) form.append('notes', payload.notes);
    if (payload.heightCm != null) form.append('heightCm', String(payload.heightCm));
    if (payload.widthCm != null) form.append('widthCm', String(payload.widthCm));
    if (payload.leafCount != null) form.append('leafCount', String(payload.leafCount));
    if (photo) form.append('photo', photo);
    return api.patch(`/plants/${plantId}/journal/${entryId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (plantId: string, entryId: string) =>
    api.delete(`/plants/${plantId}/journal/${entryId}`),
};

export const diagnosisApi = {
  submit: (plantId: string, symptomsText: string, image?: File) => {
    const form = new FormData();
    if (symptomsText) form.append('symptomsText', symptomsText);
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
};

export const usersApi = {
  me: () => api.get('/users/me'),
  completeOnboarding: (data: {
    experienceLevel: string;
    defaultLightLevel: string;
    skip?: boolean;
  }) => api.put('/users/me/onboarding', data),
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
};

export const devicesApi = {
  register: (token: string, platform: string) =>
    api.post('/devices', { token, platform }),
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
  ownerId: string;
  members: GardenMemberSummary[];
  plants: PlantShareSummary[];
  _count?: { invites: number; activity: number };
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

export const gardensApi = {
  create: (name: string) => api.post<GardenSummary>('/gardens', { name }),
  mine: () => api.get<GardenSummary[]>('/gardens/mine'),
  createInvite: (gardenId: string, data: { email?: string; role: 'CAREGIVER' | 'VIEWER' }) =>
    api.post<{ token: string; emailSent?: boolean }>(`/gardens/${gardenId}/invites`, data),
  acceptInvite: (token: string) => api.post('/gardens/invites/accept', { token }),
  sharePlant: (
    gardenId: string,
    data: { plantId: string; canComplete?: boolean; canJournal?: boolean },
  ) => api.post(`/gardens/${gardenId}/plants`, data),
  activity: (gardenId: string) => api.get<ActivityEventSummary[]>(`/gardens/${gardenId}/activity`),
};

export const buddyApi = {
  create: (data: { name: string; speciesId: string; trait: BuddyTrait }) =>
    api.post<BuddyState>('/buddy', data),
  get: () => api.get<BuddyState>('/buddy'),
  update: (data: {
    name?: string;
    trait?: BuddyTrait;
    speciesId?: string;
    equippedItems?: Record<string, unknown>;
    terrariumLayout?: Record<string, unknown>;
    terrariumBackground?: string;
  }) => api.patch<BuddyState>('/buddy', data),
  shopCatalog: () => api.get('/buddy/shop/catalog'),
  shopDaily: () => api.get('/buddy/shop/daily'),
  shopInventory: () => api.get('/buddy/shop/inventory'),
  shopPurchase: (itemId: string) => api.post('/buddy/shop/purchase', { itemId }),
  listSpecies: () => api.get('/buddy/species'),
  greeting: () => api.get<{ message: string }>('/buddy/greeting'),
  getJourney: () => api.get<JourneyResponse>('/buddy/journey'),
  startJourney: (biomeId?: string) =>
    api.post<{ journey: JourneyResponse['journey']; estimatedMinutes: number }>(
      '/buddy/journey/start',
      biomeId ? { biomeId } : {},
    ),
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
  completeActivity: (data: {
    activityType: string;
    plantId?: string;
    plantIds?: string[];
    notes?: string;
    durationSeconds?: number;
  }) =>
    api.post<{
      activity: {
        id: string;
        activityType: string;
        sunlightEarned: number;
        dewdropsEarned: number;
        tasksCompleted: number;
        completedAt: string;
      };
      buddy: BuddyState | null;
    }>('/buddy/activities/complete', data),
  getQuests: () => api.get('/buddy/quests'),
  claimQuest: (questId: string) => api.post(`/buddy/quests/${questId}/claim`),
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

export const communityApi = {
  listPosts: (limit = 30) => api.get<CommunityPostSummary[]>('/community/posts', { params: { limit } }),
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
