"use client"

import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Settings, Shield, Database, Lock } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="System Settings" 
        description="Global configuration and administrative controls."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card variant="premium">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="text-white" size={20} />
              <CardTitle>Access Control</CardTitle>
            </div>
            <CardDescription>Manage global roles and permissions.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-slate-400 text-sm font-medium italic">RBAC configuration is currently locked.</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="text-primary" size={20} />
              <CardTitle>Database Maintenance</CardTitle>
            </div>
            <CardDescription>Monitor database health and perform backups.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-sm font-bold text-white">SQLite Engine</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">Healthy</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
