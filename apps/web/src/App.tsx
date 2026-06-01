import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import { OnboardingGate } from './components/OnboardingGate';
import ProtectedRoute from './components/ProtectedRoute';
import { BuddyGate } from './components/BuddyGate';
import { Skeleton } from './components/ui/Skeleton';

// Eager: landing + structural wrappers (always in the tree, small). Everything else
// is code-split via React.lazy so the initial bundle only carries the shell. Vite
// emits a separate chunk per lazy import; the Buddy section (15 pages, gated) and
// the plant-profile tabs become their own on-demand chunks.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const GardenScoreInsights = lazy(() => import('./pages/GardenScoreInsights'));
const FilteredTasks = lazy(() => import('./pages/FilteredTasks'));
const AddPlant = lazy(() => import('./pages/AddPlant'));
const BrowsePlants = lazy(() => import('./pages/BrowsePlants'));
const SpeciesBrowseDetail = lazy(() => import('./pages/SpeciesBrowseDetail'));
const PlantProfileLayout = lazy(() => import('./pages/plant-profile/PlantProfileLayout'));
const PlantCareTab = lazy(() => import('./pages/plant-profile/PlantCareTab'));
const PlantHealthTab = lazy(() => import('./pages/plant-profile/PlantHealthTab'));
const PlantJournalTab = lazy(() => import('./pages/plant-profile/PlantJournalTab'));
const PlantOverviewTab = lazy(() => import('./pages/plant-profile/PlantOverviewTab'));
const PlantTasksTab = lazy(() => import('./pages/plant-profile/PlantTasksTab'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Settings = lazy(() => import('./pages/Settings'));
const Household = lazy(() => import('./pages/Household'));
const Community = lazy(() => import('./pages/Community'));
const Subscription = lazy(() => import('./pages/Subscription'));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const Privacy = lazy(() => import('./pages/Privacy'));
const BuddyOnboarding = lazy(() => import('./pages/buddy/onboarding'));
const BuddyHome = lazy(() => import('./pages/buddy/index'));
const BuddyJourneyPage = lazy(() => import('./pages/buddy/journey'));
const BuddyStyleHub = lazy(() => import('./pages/buddy/style/index'));
const BuddyClothingPage = lazy(() => import('./pages/buddy/style/clothing'));
const BuddyPotsPage = lazy(() => import('./pages/buddy/style/pots'));
const BuddyTerrariumPage = lazy(() => import('./pages/buddy/style/terrarium'));
const BuddySpeciesPage = lazy(() => import('./pages/buddy/style/species'));
const BuddyShopPage = lazy(() => import('./pages/buddy/style/shop'));
const BuddyActivitiesPage = lazy(() => import('./pages/buddy/activities/index'));
const BuddyActivityFlowPage = lazy(() => import('./pages/buddy/activities/flow'));
const BuddyQuestsPage = lazy(() => import('./pages/buddy/quests'));
const GardenTownPage = lazy(() => import('./pages/buddy/town/index'));
const FriendTerrariumPage = lazy(() => import('./pages/buddy/town/terrarium'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations'));
const MyGardens = lazy(() => import('./pages/gardens/MyGardens'));
const GardenDashboard = lazy(() => import('./pages/gardens/GardenDashboard'));
const GardenTasks = lazy(() => import('./pages/gardens/GardenTasks'));
const GardenPlants = lazy(() => import('./pages/gardens/GardenPlants'));
const GardenMembers = lazy(() => import('./pages/gardens/GardenMembers'));

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-4" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin/registrations" element={<AdminRegistrations />} />
        <Route path="/garden" element={<ProtectedRoute />}>
          <Route path="onboarding" element={<OnboardingWizard />} />
          <Route element={<OnboardingGate />}>
            <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="gardens" element={<MyGardens />} />
            <Route path="gardens/:gardenId" element={<GardenDashboard />} />
            <Route path="gardens/:gardenId/tasks" element={<GardenTasks />} />
            <Route path="gardens/:gardenId/care" element={<GardenTasks />} />
            <Route path="gardens/:gardenId/plants" element={<GardenPlants />} />
            <Route path="gardens/:gardenId/members" element={<GardenMembers />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="plants/browse/:speciesId" element={<SpeciesBrowseDetail />} />
            <Route path="plants/browse" element={<BrowsePlants />} />
            <Route path="plants/new" element={<AddPlant />} />
            <Route path="plants/:id" element={<PlantProfileLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<PlantOverviewTab />} />
              <Route path="care" element={<PlantCareTab />} />
              <Route path="tasks" element={<PlantTasksTab />} />
              <Route path="journal" element={<PlantJournalTab />} />
              <Route path="health" element={<PlantHealthTab />} />
              <Route path="diagnosis" element={<Navigate to="../health" replace />} />
            </Route>
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/:filter" element={<FilteredTasks />} />
            <Route path="insights/score" element={<GardenScoreInsights />} />
            <Route path="household" element={<Household />} />
            <Route path="community" element={<Community />} />
            <Route path="buddy" element={<BuddyGate />}>
              <Route path="onboarding" element={<BuddyOnboarding />} />
              <Route index element={<BuddyHome />} />
              <Route path="journey" element={<BuddyJourneyPage />} />
              <Route path="style" element={<BuddyStyleHub />} />
              <Route path="style/clothing" element={<BuddyClothingPage />} />
              <Route path="style/pots" element={<BuddyPotsPage />} />
              <Route path="style/terrarium" element={<BuddyTerrariumPage />} />
              <Route path="style/species" element={<BuddySpeciesPage />} />
              <Route path="style/shop" element={<BuddyShopPage />} />
              <Route path="activities" element={<BuddyActivitiesPage />} />
              <Route path="activities/:activityType" element={<BuddyActivityFlowPage />} />
              <Route path="quests" element={<BuddyQuestsPage />} />
              <Route path="town" element={<GardenTownPage />} />
              <Route path="town/:friendBuddyId" element={<FriendTerrariumPage />} />
            </Route>
            <Route path="settings" element={<Settings />} />
            <Route path="subscription" element={<Subscription />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
