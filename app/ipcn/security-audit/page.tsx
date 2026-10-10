"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, History, User, Activity, AlertCircle } from 'lucide-react'
import axios from 'axios'

type AuditEntry = {
  id: number
  entityType: string
  entityId: number | null
  action: string
  moduleName: string | null
  userId: number | null
  userName: string | null
  previousValue: string | null
  newValue: string | null
  timestamp: string
}

export default function SecurityAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAuditTrail = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/audit-trail')
      setEntries(res.data.data || [])
    } catch (error) {
      console.error('Gagal memuat audit trail', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditTrail()
  }, [])

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-emerald-700 bg-emerald-500/10'
    if (action.includes('UPDATE')) return 'text-blue-400 bg-blue-500/10'
    if (action.includes('DELETE')) return 'text-rose-600 bg-rose-500/10'
    if (action.includes('VERIFY')) return 'text-purple-600 bg-purple-500/10'
    if (action.includes('CLOSE')) return 'text-amber-600 bg-amber-500/10'
    return 'text-slate-600 bg-slate-500/10'
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Security Audit Trail"
        description="Rekam jejak seluruh aktivitas krusial dalam sistem PPI."
        actions={
          <div className="flex gap-3">
            <Button onClick={fetchAuditTrail} variant="outline" className="border-slate-200 text-slate-800">
              Refresh Data
            </Button>
            <Link href="/ipcn/dashboard">
              <Button variant="secondary">Kembali ke Dashboard</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status Sistem</p>
                <p className="text-lg font-bold text-slate-900">Terverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400">
                <History size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Aktivitas</p>
                <p className="text-lg font-bold text-slate-900">{entries.length} Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Modul Aktif</p>
                <p className="text-lg font-bold text-slate-900">Surveilans & Verifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-200">
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <History size={20} className="text-primary" />
            Audit History Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-500 text-slate-600 text-left border-b border-slate-200">
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Module / Entity</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                      Memuat data log audit...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                      Belum ada rekaman audit trail.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">
                        {new Date(entry.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                            <User size={12} className="text-slate-600" />
                          </div>
                          <span className="text-slate-800 font-medium">{entry.userName || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getActionColor(entry.action)}`}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-semibold">{entry.moduleName || '-'}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">{entry.entityType} #{entry.entityId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs space-y-1">
                          {entry.previousValue && (
                            <div className="text-[10px] text-rose-600 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10 line-clamp-2">
                              FROM: {entry.previousValue}
                            </div>
                          )}
                          {entry.newValue && (
                            <div className="text-[10px] text-emerald-700 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 line-clamp-2">
                              TO: {entry.newValue}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
