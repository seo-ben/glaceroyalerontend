import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, Bell, LogOut, User } from 'lucide-react'

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user }   = useAuthStore()
  const { unreadCount } = useNotificationStore()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-90"
        >
          <Menu size={20} />
        </Button>
        <div className="flex flex-col">
           <h2 className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest hidden sm:block">
              {import.meta.env.VITE_APP_NAME || 'SmartFlow SmartFlow pos'}
           </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge className="absolute top-2 right-2 h-4 min-w-4 text-[9px] bg-primary text-primary-foreground px-1 border-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* User info */}
        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
             <p className="text-xs font-black text-foreground leading-none">{user?.first_name} {user?.last_name}</p>
             <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter">
               {typeof user?.role === 'object' ? (user.role.display_name || user.role.name) : (user?.role || 'Personnel')}
             </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <User size={16} className="text-primary" />
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
          onClick={() => logout.mutate()}
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  )
}
