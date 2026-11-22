"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { EllipsisVerticalIcon, CircleUserRoundIcon, LogOutIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function NavUser({
  user,
  onSelectProfile,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onSelectProfile?: () => void
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [currentUser, setCurrentUser] = React.useState(user)
  const supabase = createClient()


  React.useEffect(() => {
    async function loadAuthUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const fullName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Pengguna"
          const avatarUrl = authUser.user_metadata?.avatar_url || user.avatar
          setCurrentUser({
            name: fullName,
            email: authUser.email || user.email,
            avatar: avatarUrl,
          })
        }
      } catch {
        // Fallback to default user
      }
    }
    loadAuthUser()

    // Dengarkan perubahan metadata akun secara realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Pengguna"
        const avatarUrl = session.user.user_metadata?.avatar_url || user.avatar
        setCurrentUser({
          name: fullName,
          email: session.user.email || user.email,
          avatar: avatarUrl,
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user.avatar, user.email, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Berhasil keluar dari akun.")
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Gagal keluar. Silakan coba lagi.")
    }
  }

  const displayName = currentUser.name || user.name
  const displayEmail = currentUser.email || user.email
  const displayAvatar = currentUser.avatar || user.avatar

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "TF"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg ring-1 ring-border">
              <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
              <AvatarFallback className="rounded-lg text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-xs text-foreground">{displayName}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {displayEmail}
              </span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg ring-1 ring-border">
                    <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
                    <AvatarFallback className="rounded-lg text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-xs">{displayName}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  onSelectProfile?.();
                  router.push("/dashboard/profile");
                }}
                className="text-xs cursor-pointer"
              >
                <CircleUserRoundIcon className="size-4 mr-2" />
                Profil Pengguna
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-xs text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOutIcon className="size-4 mr-2" />
              Keluar (Log out)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
