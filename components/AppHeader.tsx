"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/services/api"

interface AppHeaderProps {
  user?: string | null
}

export function AppHeader({ user: userProp }: AppHeaderProps) {
  const [user, setUser] = useState<string | null>(userProp ?? null)

  useEffect(() => {
    if (userProp) {
      setUser(userProp)
      return
    }
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setUser(d.user))
      .catch(() => {})
  }, [userProp])

  return (
    <header className="border-b border-border mb-6">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <QrCode className="h-5 w-5" />
          QRs Mercado Pago
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user && <span className="text-muted-foreground hidden sm:inline">{user}</span>}
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
