import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function AdminPinModal({ 
  open, 
  onClose, 
  onConfirm, 
  itemName = '', 
  targetQty = 0, 
  currentQty = 0,
  isDelete = false,
  isLoading = false 
}) {
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (open) {
      setPin('')
    }
  }, [open])

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num)
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (pin.length >= 4 && !isLoading) {
      onConfirm(pin)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[22rem] bg-card border-border text-foreground rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-3 bg-muted/40 border-b border-border space-y-2">
          <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto border border-destructive/20 shadow-lg shadow-destructive/10">
            <ShieldAlert size={24} />
          </div>
          <DialogTitle className="text-center text-lg font-black uppercase italic tracking-tight text-foreground">
            Autorisation Admin
          </DialogTitle>
          <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-wider leading-relaxed px-2">
            Cet article est déjà en cuisine. Le code PIN de l'administrateur est requis :
          </p>
          <div className="bg-background/80 py-1.5 px-3 rounded-lg border border-border/60 text-center">
            <span className="text-[11px] font-black text-foreground uppercase truncate block">{itemName}</span>
            <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">
              {isDelete || targetQty === 0 ? "Suppression de la commande" : `Quantité : ${currentQty} ➔ ${targetQty}`}
            </span>
          </div>
        </DialogHeader>

        <div className="p-6 pt-3 space-y-4">
          {/* Champ PIN Affichage */}
          <div className="flex justify-center">
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl h-14 bg-muted/50 border border-border font-black text-foreground tracking-[0.4em] rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          {/* Clavier Tactile (Numpad) pour écran tactile de caisse */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                className="h-11 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-black text-base transition-transform active:scale-95 border border-border/40"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-black text-[10px] uppercase tracking-wider transition-transform active:scale-95"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-black text-base transition-transform active:scale-95 border border-border/40"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-11 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground flex items-center justify-center transition-transform active:scale-95 border border-border/40"
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          {/* Boutons Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-11 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:text-foreground rounded-xl"
              onClick={() => {
                setPin('')
                onClose()
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-destructive/20 active:scale-95 transition-all"
              onClick={handleSubmit}
              disabled={pin.length < 4 || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                "Autoriser"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
