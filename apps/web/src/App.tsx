import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import { OnboardingGate } from './components/OnboardingGate';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import GardenScoreInsights from './pages/GardenScoreInsights';
import FilteredTasks from './pages/FilteredTasks';
import AddPlant from './pages/AddPlant';
import BrowsePlants from './pages/BrowsePlants';
import SpeciesBrowseDetail from './pages/SpeciesBrowseDetail';
import PlantProfileLayout from './pages/plant-profile/PlantProfileLayout';
import PlantCareTab from './pages/plant-profile/PlantCareTab';
import PlantHealthTab from './pages/plant-profile/PlantHealthTab';
import PlantJournalTab from './pages/plant-profile/PlantJournalTab';
import PlantOverviewTab from './pages/plant-profile/PlantOverviewTab';
import PlantTasksTab from './pages/plant-profile/PlantTasksTab';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Household from './pages/Household';
import Community from './pages/Community';
import Subscription from './pages/Subscription';
import OnboardingWizard from './pages/OnboardingWizard';
import Privacy from './pages/Privacy';
import { BuddyGate } from './components/BuddyGate';
import BuddyOnboarding from './pages/buddy/onboarding';
import BuddyHome from './pages/buddy/index';
import BuddyJourneyPage from './pages/buddy/journey';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/garden" element={<ProtectedRoute />}>
        <Route path="onboarding" element={<OnboardingWizard />} />
        <Route element={<OnboardingGate />}>
          <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
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
          </Route>
          <Route path="settings" element={<Settings />} />
          <Route path="subscription" element={<Subscription />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
