import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Calendar, Clock, User, MapPin, Activity,
  PlusCircle, MinusCircle, ArrowLeftRight, Bell, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditTrailEntry {
  id: number
  entityType: string
  entityId: number | null
  action: string
  moduleName: string | null
  userId: number | null
  userName: string | null
  field: string | null
  previousValue: string | null
  newValue: string | null
  ipAddress: string | null
  timestamp: string
  user: {
    id: number
    name: string
    email: string
    ruangan: { id: number; nama: string; kode: string } | null
  } | null
}

interface AuditTrailViewerProps {
  rawatInapId: number
  onClose?: () => void
}

type ActionCategory = 'CREATE' | 'DELETE' | 'UPDATE' | 'NOTIFY' | 'OTHER'

interface ActionIconInfo {
  icon: React.ComponentType<{ className?: string }>
  wrap: string
}

function classifyAction(action: string): { category: ActionCategory; label: string } {
  const a = (action ?? '').toString().toLowerCase()
  if (a.includes('install') || a.includes('create') || a.includes('pasang') || a.includes('tambah')) {
    return { category: 'CREATE', label: (action ?? '').toString() }
  }
  if (a.includes('remove') || a.includes('close') || a.includes('lepas') || a.includes('hapus') || a.includes('tutup')) {
    return { category: 'DELETE', label: (action ?? '').toString() }
  }
  if (a.includes('update') || a.includes('replace') || a.includes('ubah') || a.includes('edit') || a.includes('ganti')) {
    return { category: 'UPDATE', label: (action ?? '').toString() }
  }
  if (a.includes('notification') || a.includes('notif') || a.includes('send')) {
    return { category: 'NOTIFY', label: (action ?? '').toString() }
  }
  return { category: 'OTHER', label: (action ?? '').toString() }
}

function getActionIconInfo(category: ActionCategory): ActionIconInfo {
  switch (category) {
    case 'CREATE':
      return { icon: PlusCircle, wrap: 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25' }
    case 'DELETE':
      return { icon: MinusCircle, wrap: 'bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25' }
    case 'UPDATE':
      return { icon: ArrowLeftRight, wrap: 'bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25' }
    case 'NOTIFY':
      return { icon: Bell, wrap: 'bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/25' }
    case 'OTHER':
    default:
      return { icon: FileText, wrap: 'bg-slate-500/15 text-slate-600 ring-1 ring-slate-500/25' }
  }
}

const getActionText = (action: string) => {
  switch (action) {
    case 'CREATE_EVENT': return 'Laporkan Infeksi'
    case 'CLOSE_EVENT': return 'Sembuhkan Infeksi'
    case 'PENDING_CLOSURE_EVENT': return 'Ajukan Penutupan Infeksi'
    case 'INSTALL_DEVICE': return 'Pasang Alat'
    case 'REMOVE_DEVICE': return 'Lepas Alat'
    case 'REPLACE_DEVICE_OLD': return 'Lepas Alat Lama'
    case 'REPLACE_DEVICE_NEW': return 'Pasang Alat Baru'
    case 'UPDATE_TEMPERATURE': return 'Update Suhu'
    case 'NOTIFICATION_SENT': return 'Kirim Notifikasi'
    default: return action
  }
}

export default function AuditTrailViewer({ rawatInapId, onClose }: AuditTrailViewerProps) {
  const [data, setData] = useState<{ rawatInap: any; auditTrails: AuditTrailEntry[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/audit-trail?rawat_inap_id=${rawatInapId}`)
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch audit trail:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [rawatInapId])

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat riwayat...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Gagal memuat data riwayat</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900">Riwayat Aktivitas</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-slate-900 transition-colors"
          >
            Tutup
          </button>
        )}
      </div>

      <div className="border-l-4 border-indigo-500 pl-4 space-y-6">
        {data.auditTrails.length === 0 ? (
          <div className="text-gray-500 italic">Belum ada riwayat aktivitas</div>
        ) : (
          data.auditTrails.map((entry) => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[26px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white" />
              
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const { category } = classifyAction(entry.action)
                        const info = getActionIconInfo(category)
                        const IconComp = info.icon
                        return (
                          <div className={cn(
                            "w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center",
                            info.wrap
                          )}>
                            <IconComp className="w-5 h-5" />
                          </div>
                        )
                      })()}
                      <CardTitle className="text-lg text-slate-900">
                        {getActionText(entry.action)}
                      </CardTitle>
                    </div>
                    <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">
                      {entry.entityType}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {/* User & Ruangan Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {entry.user && (
                      <>
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{entry.user.name}</span>
                          {entry.user.ruangan && (
                            <span className="text-slate-500">({entry.user.ruangan.nama})</span>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(entry.timestamp).toLocaleDateString('id-ID')}</span>
                      <Clock className="w-4 h-4" />
                      <span>{new Date(entry.timestamp).toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Previous vs New Value */}
                  {(entry.previousValue || entry.newValue) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entry.previousValue && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-red-700 text-xs font-semibold mb-1">Sebelumnya:</div>
                          <pre className="text-red-600 text-xs whitespace-pre-wrap break-all">
                            {entry.previousValue}
                          </pre>
                        </div>
                      )}
                      {entry.newValue && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="text-green-700 text-xs font-semibold mb-1">Sesudahnya:</div>
                          <pre className="text-green-600 text-xs whitespace-pre-wrap break-all">
                            {entry.newValue}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
