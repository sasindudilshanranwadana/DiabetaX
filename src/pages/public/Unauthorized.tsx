import { Link } from 'react-router-dom'

export function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-200 via-surface-200 to-surface-300 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm mb-8">You don't have permission to view this page.</p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/patient/dashboard"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
