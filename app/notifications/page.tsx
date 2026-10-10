"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

type NotificationItem = {
  id: number
  type: string
  category: string
  title: string
  message: string
  payload: any
  isRead: boolean
  createdAt: string | null
  createdBy: string | null
  relatedEntityType?: string
  relatedEntityId?: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedInfectionType, setSelectedInfectionType] = useState('')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/notifications')
      setNotifications(res.data.data || [])
    } catch (error) {
      console.error('Gagal memuat notifikasi', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const toggleRead = async (id: number, isRead: boolean) => {
    try {
      await axios.patch('/api/notifications', { id, isRead: !isRead })
      fetchNotifications()
    } catch (error) {
      console.error('Gagal memperbarui status notifikasi', error)
    }
  }

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const matchesDate = !selectedDate || (item.createdAt || '').startsWith(selectedDate)
      const matchesRoom = !selectedRoom || (item.payload?.ruangan || '').toLowerCase().includes(selectedRoom.toLowerCase())
      const matchesInfection = !selectedInfectionType || (item.payload?.infectionType || '').toLowerCase().includes(selectedInfectionType.toLowerCase())
      return matchesCategory && matchesDate && matchesRoom && matchesInfection
    })
  }, [notifications, selectedCategory, selectedDate, selectedRoom, selectedInfectionType])

  const categories = Array.from(new Set(notifications.map((item) => item.category)))

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Notification Center IPCN"
        description="Pantau kasus infeksi, alat berisiko tinggi, dan verifikasi yang menunggu"
        actions={
          <Link href="/ipcn/dashboard">
            <Button variant="secondary">Kembali ke Dashboard</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">Semua Kategori</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        <input type="text" placeholder="Filter ruangan" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        <input type="text" placeholder="Filter jenis infeksi" value={selectedInfectionType} onChange={(e) => setSelectedInfectionType(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card className="bg-white border-slate-200"><CardContent className="p-6 text-slate-600">Memuat notifikasi...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card className="bg-white border-slate-200"><CardContent className="p-6 text-slate-600">Tidak ada notifikasi yang cocok dengan filter saat ini.</CardContent></Card>
        ) : filtered.map((notif) => (
          <Card key={notif.id} className={`border ${notif.isRead ? 'border-slate-200 bg-white' : 'border-emerald-300 bg-white/90'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`rounded-2xl p-3 ${notif.isRead ? 'bg-slate-500/10 text-slate-600' : 'bg-emerald-500/10 text-emerald-700'}`}>
                    <Bell size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{notif.title}</p>
                      {!notif.isRead && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Baru</span>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-500 mt-3">{notif.createdAt ? new Date(notif.createdAt).toLocaleString('id-ID') : '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => toggleRead(notif.id, notif.isRead)} variant="outline" className="text-slate-800 border-slate-200">{notif.isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}</Button>
                  {notif.relatedEntityType === 'PenggunaanAntibiotik' && (
                    <Button onClick={() => router.push(`/ipcln/antibiotik?abId=${notif.relatedEntityId}`)} className="bg-purple-600 hover:bg-purple-700 text-slate-900">
                      Buka Detail Antibiotik
                    </Button>
                  )}
                  {(notif.payload?.infectionType || notif.payload?.ruangan) && <Button onClick={() => router.push('/ipcn/verifikasi')} className="bg-emerald-600 hover:bg-emerald-700 text-slate-900">Buka Verifikasi</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
