"use client"

import { useState } from "react"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

type UserMenuProps = {
  user: {
    name: string
    username: string
    email: string
    picture?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-accent hover:bg-accent/80 transition-colors flex items-center justify-center border border-border cursor-pointer"
      >
        {user.picture ? (
          <img src={user.picture || "/placeholder.svg"} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-card border border-border shadow-xl z-50">
            <div className="p-4 border-b border-border">
              <div className="font-medium text-sm truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{user.email}</div>
            </div>
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start font-mono text-xs cursor-pointer"
              >
                <LogOut className="w-3 h-3 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
