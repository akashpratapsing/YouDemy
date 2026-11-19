import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardLayoutSkeleton } from '@/components/layout/DashboardLayoutSkeleton';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PlaylistLibraryPage = lazy(() =>
  import('@/pages/PlaylistLibraryPage').then((m) => ({ default: m.PlaylistLibraryPage })),
);
const LearningPage = lazy(() => import('@/pages/LearningPage').then((m) => ({ default: m.LearningPage })));
const RecentlyWatchedPage = lazy(() =>
  import('@/pages/RecentlyWatchedPage').then((m) => ({ default: m.RecentlyWatchedPage })),
);
const CompletedPage = lazy(() => import('@/pages/CompletedPage').then((m) => ({ default: m.CompletedPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function GuestOnly() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <DashboardLayoutSkeleton />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="playlists" element={<PlaylistLibraryPage />} />
            <Route path="playlists/:playlistId" element={<LearningPage />} />
            <Route path="recently-watched" element={<RecentlyWatchedPage />} />
            <Route path="completed" element={<CompletedPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
