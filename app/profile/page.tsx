"use client"

import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { User, Mail, Shield } from "lucide-react"
import { useSession } from "next-auth/react"

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Account Settings" 
        description="Manage your profile information and security preferences."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card variant="premium" className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-4">
              <User size={48} />
            </div>
            <CardTitle>{session?.user?.name}</CardTitle>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
              {(session?.user as any)?.role || 'User'}
            </p>
          </CardHeader>
        </Card>
        <Card variant="glass" className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Mail className="text-primary" size={20} />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</p>
                <p className="text-white font-medium">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <Shield className="text-primary" size={20} />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Role</p>
                <p className="text-white font-medium">{(session?.user as any)?.role || 'Standard Access'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
