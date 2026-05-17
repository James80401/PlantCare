import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AddPlant from './pages/AddPlant';
import BrowsePlants from './pages/BrowsePlants';
import PlantProfile from './pages/PlantProfile';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/garden"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="plants/browse" element={<BrowsePlants />} />
        <Route path="plants/new" element={<AddPlant />} />
        <Route path="plants/:id" element={<PlantProfile />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscription" element={<Subscription />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
