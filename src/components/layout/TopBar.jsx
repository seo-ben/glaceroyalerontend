import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { getActiveRegister, setActiveRegister } from '@/lib/localPrinting'
import apiClient from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Menu, Bell, LogOut, User, Printer, Lock, Loader2 } from 'lucide-react'

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user }   = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [activeRegister, setLocalActiveRegister] = useState(() => getActiveRegister())
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isValidatingPin, setIsValidatingPin] = useState(false)

  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    const onChanged = (e) => setLocalActiveRegister(e.detail || getActiveRegister())
    window.addEventListener('pos-register-changed', onChanged)
    return () => window.removeEventListener('pos-register-changed', onChanged)
  }, [])

  const applyRegisterSwitch = () => {
    const next = activeRegister === '1' ? '2' : '1'
    setLocalActiveRegister(setActiveRegister(next))
    toast({
      title: `Caisse ${next} activée`,
      description: `Ce poste imprime désormais sur l'imprimante Caisse ${next}.`,
    })
  }

  const handleRegisterClick = () => {
    if (isAdmin) {
      applyRegisterSwitch()
      return
    }
    setAdminPin('')
    setPinError('')
    setPinModalOpen(true)
  }

  const handleValidatePin = async (e) => {
    e.preventDefault()
    if (adminPin.trim().length < 4) {
      setPinError('Veuillez saisir le code PIN Admin (4 à 6 chiffres).')
      return
    }
    setIsValidatingPin(true)
    setPinError('')
    try {
      await apiClient.post('/auth/validate-admin-pin', { pin: adminPin.trim() })
      setPinModalOpen(false)
      setAdminPin('')
      applyRegisterSwitch()
    } catch (err) {
      setPinError(err?.response?.data?.message || 'Code PIN Admin incorrect.')
    } finally {
      setIsValidatingPin(false)
    }
  }

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
        {/* Sélecteur rapide Caisse 1 / Caisse 2 pour ce poste (protégé par PIN Admin pour non-admins) */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegisterClick}
          title={isAdmin ? "Cliquer pour basculer entre Caisse 1 et Caisse 2 sur cet appareil" : "Code PIN Admin requis pour changer de caisse"}
          className="h-8 px-2.5 gap-1.5 text-[11px] font-bold border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 rounded-lg"
        >
          <Printer size={13} />
          <span>Caisse {activeRegister}</span>
          {!isAdmin && <Lock size={11} className="opacity-70" />}
        </Button>

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

      {/* Modal Code PIN Admin pour changer de caisse */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="max-w-xs bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black uppercase">
              <Lock size={16} className="text-primary" />
              Autorisation Admin
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Entrez le code PIN Administrateur pour basculer ce poste vers <strong>Caisse {activeRegister === '1' ? '2' : '1'}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleValidatePin} className="space-y-4 pt-1">
            <div>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="Code PIN Admin"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value)
                  if (pinError) setPinError('')
                }}
                className="text-center text-lg font-mono tracking-[0.4em] bg-muted border-border"
              />
              {pinError && (
                <p className="text-xs text-red-500 font-semibold mt-2 text-center">{pinError}</p>
              )}
            </div>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setPinModalOpen(false)} disabled={isValidatingPin}>
                Annuler
              </Button>
              <Button type="submit" disabled={isValidatingPin || adminPin.trim().length < 4} className="gap-1.5 font-bold">
                {isValidatingPin && <Loader2 size={14} className="animate-spin" />}
                Valider
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  )
}
