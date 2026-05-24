import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-200 via-surface-200 to-surface-300 flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <h1 className="text-xl font-bold text-white">DiabetaX</h1>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary-400 mb-6">
            Academic Research Platform
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Diabetes Treatment<br />
            <span className="text-primary-400">Outcomes & Safety</span>
          </h2>

          <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            A secure research platform studying the effectiveness and long-term side effects of anti-diabetic medications. South Asian patient data focus.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              to="/register"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              Participate in Research
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Drug Classes', value: '8+', desc: 'Metformin, GLP-1, SGLT2, and more' },
              { label: 'Data Points', value: '500+', desc: 'Synthetic patient records for training' },
              { label: 'Outcomes Tracked', value: '4', desc: 'HbA1c, side effects, adherence, QoL' },
            ].map(item => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <p className="text-3xl font-bold text-white mb-1">{item.value}</p>
                <p className="text-sm font-medium text-gray-300 mb-1">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="px-8 py-5 border-t border-white/5 text-center text-xs text-gray-600">
        DiabetaX — Academic research by R M D L Sarathchandra (ID 30068), supervised by Dr. Damayanthi Dahanayake. Not medical advice.
      </footer>
    </div>
  )
}
