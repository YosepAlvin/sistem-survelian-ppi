import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Calendar, Clock, User, MapPin, Activity } from 'lucide-react'

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

const getActionIcon = (action: string) => {
  const lowerAction = action.toLowerCase()
  if (lowerAction.includes('install') || lowerAction.includes('create')) return '📌'
  if (lowerAction.includes('remove') || lowerAction.includes('close')) return '❌'
  if (lowerAction.includes('update') || lowerAction.includes('replace')) return '🔄'
  if (lowerAction.includes('notification')) return '🔔'
  return '📝'
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
        <h3 className="text-xl font-bold text-white">Riwayat Aktivitas</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
              <div className="absolute -left-[26px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-gray-900" />
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getActionIcon(entry.action)}</span>
                      <CardTitle className="text-lg text-white">
                        {getActionText(entry.action)}
                      </CardTitle>
                    </div>
                    <span className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded">
                      {entry.entityType}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {/* User & Ruangan Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {entry.user && (
                      <>
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{entry.user.name}</span>
                          {entry.user.ruangan && (
                            <span className="text-gray-500">({entry.user.ruangan.nama})</span>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-gray-400">
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
                        <div className="bg-red-900/20 border border-red-800 rounded p-3">
                          <div className="text-red-400 text-xs font-semibold mb-1">Sebelumnya:</div>
                          <pre className="text-red-300 text-xs whitespace-pre-wrap break-all">
                            {entry.previousValue}
                          </pre>
                        </div>
                      )}
                      {entry.newValue && (
                        <div className="bg-green-900/20 border border-green-800 rounded p-3">
                          <div className="text-green-400 text-xs font-semibold mb-1">Sesudahnya:</div>
                          <pre className="text-green-300 text-xs whitespace-pre-wrap break-all">
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
