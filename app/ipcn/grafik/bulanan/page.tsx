"use client"

import React, { useState } from 'react'
import Link from "next/link"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"

const data = [
  { name: 'Jan', ISK: 2, IADP: 1, VAP: 0, PLB: 4 },
  { name: 'Feb', ISK: 1, IADP: 0, VAP: 1, PLB: 3 },
  { name: 'Mar', ISK: 3, IADP: 2, VAP: 0, PLB: 5 },
  { name: 'Apr', ISK: 0, IADP: 1, VAP: 2, PLB: 2 },
  { name: 'Mei', ISK: 1, IADP: 0, VAP: 1, PLB: 4 },
  { name: 'Jun', ISK: 2, IADP: 1, VAP: 0, PLB: 3 },
]

export default function TrenInfeksiPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-8 shadow-xl shadow-slate-200/50">
          <PageHeader
            title="Tren Infeksi Rumah Sakit"
            description="Visualisasi data infeksi selama 6 bulan terakhir"
            backHref="/ipcn/dashboard"
            breadcrumbs={[{ label: 'Dashboard', href: '/ipcn/dashboard' }, { label: 'Grafik Bulanan' }]}
          />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/95 border-slate-200">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6 text-slate-900">Perbandingan Jenis Infeksi (Bar Chart)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ISK" fill="#ef4444" />
                    <Bar dataKey="IADP" fill="#3b82f6" />
                    <Bar dataKey="VAP" fill="#f59e0b" />
                    <Bar dataKey="PLB" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card className="bg-white/95 border-slate-200">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6 text-slate-900">Tren Kejadian Infeksi (Line Chart)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ISK" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="IADP" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="VAP" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="PLB" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-white/95 border-slate-200">
          <div className="p-6 bg-white/80 rounded">
            <h3 className="font-bold text-slate-900 mb-4">Analisis Tren:</h3>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
              <li>Kejadian Phlebitis (PLB) merupakan yang tertinggi namun menunjukkan tren menurun di bulan April.</li>
              <li>ISK cenderung fluktuatif dengan puncak di bulan Maret.</li>
              <li>VAP menunjukkan kenaikan di bulan April, perlu evaluasi prosedur suction dan oral hygiene.</li>
              <li>IADP relatif stabil di angka 0-2 kejadian per bulan.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  </div>
  )
}