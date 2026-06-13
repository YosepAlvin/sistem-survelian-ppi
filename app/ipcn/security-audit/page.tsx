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
    if (action.includes('CREATE')) return 'text-emerald-400 bg-emerald-500/10'
    if (action.includes('UPDATE')) return 'text-blue-400 bg-blue-500/10'
    if (action.includes('DELETE')) return 'text-rose-400 bg-rose-500/10'
    if (action.includes('VERIFY')) return 'text-purple-400 bg-purple-500/10'
    if (action.includes('CLOSE')) return 'text-amber-400 bg-amber-500/10'
    return 'text-slate-400 bg-slate-500/10'
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Security Audit Trail"
        description="Rekam jejak seluruh aktivitas krusial dalam sistem PPI."
        actions={
          <div className="flex gap-3">
            <Button onClick={fetchAuditTrail} variant="outline" className="border-slate-700 text-slate-200">
              Refresh Data
            </Button>
            <Link href="/ipcn/dashboard">
              <Button variant="secondary">Kembali ke Dashboard</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status Sistem</p>
                <p className="text-lg font-bold text-white">Terverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400">
                <History size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Aktivitas</p>
                <p className="text-lg font-bold text-white">{entries.length} Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-400">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Modul Aktif</p>
                <p className="text-lg font-bold text-white">Surveilans & Verifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardHeader className="bg-slate-950 border-b border-white/5">
          <CardTitle className="text-white flex items-center gap-2">
            <History size={20} className="text-primary" />
            Audit History Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 text-left border-b border-white/5">
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
                    <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                        {new Date(entry.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <User size={12} className="text-slate-400" />
                          </div>
                          <span className="text-slate-200 font-medium">{entry.userName || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getActionColor(entry.action)}`}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-semibold">{entry.moduleName || '-'}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">{entry.entityType} #{entry.entityId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs space-y-1">
                          {entry.previousValue && (
                            <div className="text-[10px] text-rose-400 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10 line-clamp-2">
                              FROM: {entry.previousValue}
                            </div>
                          )}
                          {entry.newValue && (
                            <div className="text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 line-clamp-2">
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
