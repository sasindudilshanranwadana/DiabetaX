import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from './primitives/input'
import { Button } from './primitives/button'
import { cn } from '../../lib/utils'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  searchable?: boolean
  searchKeys?: (keyof T)[]
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends object>({
  columns,
  data,
  pageSize = 20,
  searchable = false,
  searchKeys = [],
  emptyMessage = 'No data found.',
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = searchable && search
    ? data.filter(row =>
        searchKeys.some(key => {
          const val = row[key]
          return typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
        })
      )
    : data

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function getCellValue(row: T, col: Column<T>): React.ReactNode {
    if (col.render) return col.render(row)
    const val = (row as Record<string, unknown>)[col.key as string]
    return val == null ? <span className="text-muted-foreground/50">—</span> : String(val)
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {columns.map(col => (
                <th
                  key={col.key as string}
                  className={cn(
                    'px-4 py-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-white/5 transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-white/[0.04]'
                  )}
                >
                  {columns.map(col => (
                    <td key={col.key as string} className={cn('px-4 py-3 text-foreground', col.className)}>
                      {getCellValue(row, col)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 w-7">
              <ChevronLeft size={14} />
            </Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="ghost" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-7 w-7">
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
