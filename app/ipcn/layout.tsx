"use client"

import { AppLayout } from "@/components/layout/AppLayout"

export default function IPCNLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}
