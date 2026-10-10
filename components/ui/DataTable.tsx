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
  key: keyof T | string
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
        <div className={cn("w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6", className)}>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-10 bg-slate-100 rounded-xl animate-pulse flex-1" />
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
          "w-full flex flex-col items-center justify-center py-20 rounded-[2rem] border border-slate-200 bg-white text-slate-600",
          className
        )}>
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
            <Inbox size={24} className="opacity-50 text-slate-600" />
          </div>
          <p className="font-bold uppercase tracking-widest text-[10px]">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white backdrop-blur-xl shadow-2xl shadow-slate-200/50", className)}>
        {/* Search Bar */}
        {searchable && (
          <div className="p-6 border-b border-slate-200">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-500 mt-2">
                Found {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className={cn(
                "bg-slate-50 border-b border-slate-200 transition-colors",
                stickyHeader && "sticky top-0 z-10"
              )}>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600",
                      "whitespace-nowrap select-none group",
                      column.sortable && "cursor-pointer hover:text-slate-900 transition-colors",
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
            <tbody className="divide-y divide-slate-200">
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "group transition-all duration-300 hover:bg-slate-50",
                    onRowClick && "cursor-pointer active:bg-slate-100"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-8 py-5 text-slate-700 font-medium group-hover:text-slate-900 transition-colors",
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
          <div className="flex items-center justify-between px-8 py-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        ? "bg-primary text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
