import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { useRole } from './hooks/useRole'
import { AppShell } from './components/layout/AppShell'
import { RoleGuard } from './components/guards/RoleGuard'
import { ConsentGuard } from './components/guards/ConsentGuard'
import { defaultRouteForRole } from './lib/auth-routing'
import { Toaster } from './components/ui/primitives/toaster'
import { Logo } from './components/ui/Logo'

import { Landing } from './pages/public/Landing'
import { Login } from './pages/public/Login'
import { Register } from './pages/public/Register'
import { ResetPassword } from './pages/public/ResetPassword'
import { Consent } from './pages/public/Consent'
import { Unauthorized } from './pages/public/Unauthorized'
import { AuthCallback } from './pages/public/AuthCallback'

import { PatientDashboard } from './pages/patient/Dashboard'
import { Profile } from './pages/patient/Profile'
import { Baseline } from './pages/patient/survey/Baseline'
import { Followup3m } from './pages/patient/survey/Followup3m'
import { Followup6m } from './pages/patient/survey/Followup6m'
import { Submissions } from './pages/patient/Submissions'
import { Insights } from './pages/patient/Insights'

import { AdminDashboard } from './pages/admin/Dashboard'
import { Participants } from './pages/admin/Participants'
import { AdminSubmissions } from './pages/admin/Submissions'
import { Analytics } from './pages/admin/Analytics'
import { DataQuality } from './pages/admin/DataQuality'
import { Exports } from './pages/admin/Exports'
import { Models } from './pages/admin/Models'
import { Settings } from './pages/admin/Settings'
import { CDS } from './pages/admin/CDS'

function FullScreenLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
        <Logo size="lg" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Initialising…</span>
        </div>
      </motion.div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { role, loading: roleLoading } = useRole(user?.id)

  if (authLoading || roleLoading) return <FullScreenLoader />

  const defaultRoute = defaultRouteForRole(role)

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to={defaultRoute} replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={defaultRoute} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/consent" replace /> : <Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/consent" element={user ? <Consent /> : <Navigate to="/login" replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route
          element={
            user
              ? <ConsentGuard uid={user.id}><AppShell user={user} role={role} /></ConsentGuard>
              : <Navigate to="/login" replace />
          }
        >
          {/* Patient */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/profile" element={<Profile />} />
          <Route path="/patient/survey/baseline" element={<Baseline />} />
          <Route path="/patient/survey/followup-3m" element={<Followup3m />} />
          <Route path="/patient/survey/followup-6m" element={<Followup6m />} />
          <Route path="/patient/submissions" element={<Submissions />} />
          <Route path="/patient/insights" element={<Insights />} />

          {/* Admin — research_admin+ */}
          <Route path="/admin/dashboard" element={<RoleGuard role={role} required="research_admin"><AdminDashboard /></RoleGuard>} />
          <Route path="/admin/participants" element={<RoleGuard role={role} required="research_admin"><Participants /></RoleGuard>} />
          <Route path="/admin/submissions" element={<RoleGuard role={role} required="research_admin"><AdminSubmissions /></RoleGuard>} />
          <Route path="/admin/analytics" element={<RoleGuard role={role} required="research_admin"><Analytics /></RoleGuard>} />
          <Route path="/admin/data-quality" element={<RoleGuard role={role} required="research_admin"><DataQuality /></RoleGuard>} />
          <Route path="/admin/exports" element={<RoleGuard role={role} required="research_admin"><Exports /></RoleGuard>} />
          <Route path="/admin/models" element={<RoleGuard role={role} required="research_admin"><Models /></RoleGuard>} />

          {/* Clinician+ */}
          <Route path="/admin/cds" element={<RoleGuard role={role} required="clinician_admin"><CDS /></RoleGuard>} />

          {/* Super admin only */}
          <Route path="/admin/settings" element={<RoleGuard role={role} required="super_admin"><Settings /></RoleGuard>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? defaultRoute : '/'} replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  )
}
