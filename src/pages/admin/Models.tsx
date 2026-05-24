import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { GlassCard } from '../../components/ui/GlassCard'
import { DataTable } from '../../components/ui/DataTable'

interface Model {
  id: string
  name: string
  version: string
  metrics: Record<string, unknown>
  trained_at: string
  is_active: boolean
}

export function Models() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('ml_models').select('*').order('trained_at', { ascending: false }).then(({ data }) => {
      setModels((data ?? []) as Model[])
      setLoading(false)
    })
  }, [])

  const columns = [
    { key: 'name', header: 'Model Name' },
    { key: 'version', header: 'Version' },
    {
      key: 'metrics',
      header: 'Metrics',
      render: (r: Model) => (
        <span className="text-xs text-gray-400 font-mono">
          {Object.entries(r.metrics ?? {}).map(([k, v]) => `${k}: ${typeof v === 'number' ? (v as number).toFixed(3) : v}`).join(' · ')}
        </span>
      ),
    },
    { key: 'trained_at', header: 'Trained', render: (r: Model) => new Date(r.trained_at).toLocaleDateString() },
    {
      key: 'is_active',
      header: 'Status',
      render: (r: Model) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
          {r.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">AI Models</h2>
        <p className="text-gray-400 text-sm">Read-only registry of trained models. Models are trained externally and written to this registry by the Python ML pipeline.</p>
      </div>

      <div className="px-4 py-3 rounded-lg bg-purple-500/5 border border-purple-500/10 text-purple-300 text-xs">
        AI model outputs are for research purposes only. Predictions are not used for clinical decision-making without appropriate validation and oversight.
      </div>

      {models.length === 0 ? (
        <GlassCard>
          <div className="py-12 text-center text-gray-500 text-sm">
            No ML models registered yet. Train models using the Python pipeline and write results to the <code className="text-gray-400">ml_models</code> table.
          </div>
        </GlassCard>
      ) : (
        <DataTable columns={columns} data={models} emptyMessage="No models found." />
      )}
    </div>
  )
}
