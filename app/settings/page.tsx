"use client"

import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Bell, Moon, Monitor, Globe } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Preferences" 
        description="Customize your experience and notification settings."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="text-primary" size={20} />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Control how you receive alerts and reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm font-medium italic">Notification preferences coming soon...</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="text-primary" size={20} />
              <CardTitle>System Language</CardTitle>
            </div>
            <CardDescription>Choose your preferred language for the interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-white font-bold">Bahasa Indonesia (Default)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
