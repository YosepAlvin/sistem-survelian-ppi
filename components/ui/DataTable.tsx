import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Inbox, 
  Search, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'

interface DataTableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  stickyHeader?: boolean
  onRowClick?: (row: T) => void
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
  paginated?: boolean
  pageSize?: number
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  ({
    columns,
    data,
    loading = false,
    emptyMessage = "No records found",
    stickyHeader = true,
    onRowClick,
    className,
    searchable = false,
    searchPlaceholder = "Search...",
    paginated = false,
    pageSize = 10
  }, ref) => {
    const [sortKey, setSortKey] = React.useState<string | null>(null)
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
    const [searchQuery, setSearchQuery] = React.useState('')
    const [currentPage, setCurrentPage] = React.useState(1)

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        setSortKey(key)
        setSortOrder('asc')
      }
    }

    const filteredData = React.useMemo(() => {
      if (!searchQuery) return data
      const query = searchQuery.toLowerCase()
      return data.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }, [data, searchQuery])

    const sortedData = React.useMemo(() => {
      if (!sortKey) return filteredData
      
      const sorted = [...filteredData].sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
      
      return sorted
    }, [filteredData, sortKey, sortOrder])

    const totalPages = paginated ? Math.ceil(sortedData.length / pageSize) : 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = paginated ? sortedData.slice(startIndex, endIndex) : sortedData

    if (loading) {
      return (
        <div className={cn("w-full overflow-hidden rounded-[2rem] border border-white/5 bg-[#172033]/50 p-6", className)}>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-10 bg-white/5 rounded-xl animate-pulse flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className={cn(
          "w-full flex flex-col items-center justify-center py-20 rounded-[2rem] border border-white/5 bg-[#172033]/50 text-slate-500",
          className
        )}>
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
            <Inbox size={24} className="opacity-20" />
          </div>
          <p className="font-bold uppercase tracking-widest text-[10px]">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("w-full overflow-hidden rounded-[2rem] border border-white/5 bg-[#172033]/50 backdrop-blur-xl shadow-2xl shadow-black/20", className)}>
        {/* Search Bar */}
        {searchable && (
          <div className="p-6 border-b border-white/5">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-500 mt-2">
                Found {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className={cn(
                "bg-white/5 border-b border-white/5 transition-colors",
                stickyHeader && "sticky top-0 z-10"
              )}>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500",
                      "whitespace-nowrap select-none group",
                      column.sortable && "cursor-pointer hover:text-white transition-colors",
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronUp size={10} className={cn(sortKey === String(column.key) && sortOrder === 'asc' && "text-primary")} />
                          <ChevronDown size={10} className={cn(sortKey === String(column.key) && sortOrder === 'desc' && "text-primary")} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "group transition-all duration-300 hover:bg-white/5",
                    onRowClick && "cursor-pointer active:bg-white/10"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-8 py-5 text-slate-300 font-medium group-hover:text-white transition-colors",
                        column.className
                      )}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginated && totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-white/5">
            <p className="text-sm text-slate-500">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-semibold transition-all",
                      currentPage === page
                        ? "bg-primary text-white"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
)
DataTable.displayName = "DataTable"

export { DataTable }
