import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react'
import logo from '@/assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [mode, setMode]       = useState('email') // 'email' | 'pin'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin]         = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError]     = useState('')

  const loginMutation = useMutation({
    mutationFn: (data) => mode === 'pin' ? authApi.loginPin(data) : authApi.login(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token)
    },
    onError: (e) => {
      const backendError = e.response?.data?.errors;
      const primaryMessage = backendError ? Object.values(backendError)[0][0] : e.response?.data?.message;
      setError(primaryMessage || 'Une erreur de connexion est survenue')
    },
  })

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'pin') {
      loginMutation.mutate({ 
        restaurant_id: import.meta.env.VITE_RESTAURANT_ID || 1, 
        pin: pin 
      })
    } else {
      loginMutation.mutate({ email, password })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full -ml-64 -mb-64 pointer-events-none" />

      <div className="w-full max-w-sm space-y-10 animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 transform -rotate-6 overflow-hidden p-3">
            <img src={logo} alt="SmartFlow Logo" className="w-full h-full object-contain invert grayscale brightness-[5] dark:invert-0 dark:brightness-100" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">SmartFlow POS</h1>
            <p className="text-muted-foreground/60 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Restaurant Management System</p>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-card rounded-2xl p-1.5 border border-border mx-auto w-fit shadow-sm">
          <button
            onClick={() => setMode('email')}
            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
              mode === 'email' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setMode('pin')}
            className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
              mode === 'pin' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            PIN
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'email' ? (
            <div className="space-y-4">
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email professionnel</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="manager@omega.com"
                    className="h-14 mt-2 bg-card border-border rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:ring-primary/50 focus:border-primary font-bold px-6 shadow-sm"
                    required
                  />
               </div>
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 mt-2 bg-card border-border rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:ring-primary/50 focus:border-primary font-bold px-6 shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="text-center">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code confidentiel</Label>
                  <div className="mt-4 flex justify-center gap-4">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length > i ? 'bg-primary border-primary scale-125' : 'border-border bg-transparent'}`} />
                     ))}
                  </div>
               </div>
               {/* Numerical Pad */}
               <div className="grid grid-cols-3 gap-3">
                 {[1,2,3,4,5,6,7,8,9, 'C', 0, '⌫'].map((n, i) => (
                   <button
                     key={i}
                     type="button"
                     onClick={() => {
                        if (n === '⌫') setPin(p => p.slice(0, -1))
                        else if (n === 'C') setPin('')
                        else if (pin.length < 4) setPin(p => p + n)
                     }}
                     className="h-16 rounded-2xl bg-card border border-border text-xl font-bold text-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all active:scale-95 shadow-md flex items-center justify-center"
                   >
                     {n}
                   </button>
                 ))}
               </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-[11px] font-black uppercase tracking-tighter text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-shake">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending || (mode === 'pin' && pin.length < 4)}
            className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0"
          >
            {loginMutation.isPending ? (
              <div className="w-6 h-6 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'Authentification'
            )}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <Link
            to="/doc"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors hover:gap-3 group"
          >
            <BookOpen size={14} className="group-hover:scale-110 transition-transform" />
            <span className="uppercase tracking-widest text-[10px] font-black">Guide d'utilisation</span>
          </Link>
          <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
             &copy; {new Date().getFullYear()} SMARTFLOW POS - VERSION 2.1
          </p>
        </div>
      </div>
    </div>
  )
}
