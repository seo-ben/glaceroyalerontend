import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import { formatAmount, paymentMethodLabel } from '@/lib/formatters'
import { PAYMENT_METHODS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import apiClient from '@/api/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertTriangle, Loader2, Banknote, CreditCard, Smartphone, Tag as TagIcon, ShieldCheck, QrCode } from 'lucide-react'

function ArdoiseSelector({ onSelect, selectedId }) {
    const { data: tabs = [] } = useQuery({
        queryKey: ['customer-tabs-list'],
        queryFn: () => apiClient.get('/customer-tabs?status=open').then(r => r.data?.data || r.data),
    });

    const list = Array.isArray(tabs) ? tabs : (tabs.data || []);

    return (
        <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Sélectionner le client</Label>
            <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {list.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground/50 italic p-4 text-center border border-dashed border-border rounded-xl">
                        Aucune ardoise ouverte. <br/>Créez-en une dans le menu Ardoises.
                    </div>
                ) : (
                    list.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onSelect(String(tab.id))}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                String(selectedId) === String(tab.id)
                                    ? "bg-primary border-primary text-primary-foreground shadow-lg"
                                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase italic leading-none">{tab.first_name} {tab.last_name}</span>
                                <span className="text-[8px] font-bold opacity-40 mt-1">{tab.phone}</span>
                            </div>
                            <CheckCircle2 size={14} className={cn(String(selectedId) === String(tab.id) ? "opacity-100" : "opacity-0")} />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

export default function PaymentModal({ open, onClose, onSubmit, isLoading }) {
  const { total, subtotal, discountAmount, vatAmount, vatRate, orderType, promoActive, promoRate, gozemRate, discount } = useCart()
  const [method, setMethod]     = useState('cash')
  const [received, setReceived] = useState('')
  const [reference, setReference] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loyaltyToken, setLoyaltyToken] = useState('')

  // Check if cash session is open
  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session'],
    queryFn: () => apiClient.get('/cash-sessions/current').then(r => r.data),
    enabled: open,
  })

  // Synchronize initial received amount when modal opens
  useEffect(() => {
    if (open) {
      setReceived(total.toFixed(0))
    }
  }, [open, total])

  const amountReceived = parseFloat(received) || 0
  const change         = method === 'cash' ? Math.max(0, amountReceived - total) : 0
  const isSessionOpen  = !!sessionData
  
  const canPay = useMemo(() => {
    if (method === 'cash') {
       return amountReceived >= total && isSessionOpen
    }
    if (method === 'customer_tab') {
        return !!reference
    }
    return reference.length > 2 || method === 'card'
  }, [method, amountReceived, total, isSessionOpen, reference])

  const handlePay = () => {
    onSubmit({
      method:    method,
      amount:    total,
      amount_given: method === 'cash' ? amountReceived : null,
      reference:    method !== 'cash' ? reference : null,
      customer_name: customerName,
      loyalty_token: loyaltyToken || null,
    })
  }

  // Helper icons for the methods
  const getMethodIcon = (m) => {
    if (m === 'cash') return <Banknote size={20} />
    if (m === 'card') return <CreditCard size={20} />
    return <Smartphone size={20} />
  }

  const { setDiscount, orderId } = useCart()
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountPin, setDiscountPin] = useState('')
  const [tempDiscount, setTempDiscount] = useState({ type: 'fixed', value: '', reason: '' })

  const { mutate: applyDiscount, isLoading: isApplyingDiscount } = useMutation({
    mutationFn: (data) => apiClient.put(`/orders/${orderId}/discount`, data),
    onSuccess: (res) => {
        const order = res.data.data || res.data;
        setDiscount(order.discount_type, order.discount_value, order.discount_reason);
        setShowDiscount(false);
        setDiscountPin('');
    },
    onError: (err) => {
        alert(err.response?.data?.message || 'Erreur lors de l\'application de la remise');
    }
  })

  const handleApplyDiscount = () => {
    if (!tempDiscount.value || !discountPin) return;
    
    applyDiscount({
        type:   tempDiscount.type,
        value:  parseFloat(tempDiscount.value),
        reason: tempDiscount.reason || 'Remise commerciale', // Motif par défaut
        pin:    discountPin
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="md:max-w-[700px] max-w-[95vw] w-full max-h-[90vh] bg-card border-border text-foreground rounded-[2rem] shadow-2xl p-0 flex flex-col overflow-hidden font-sans">
        <DialogHeader className="p-6 pb-3 bg-muted/40 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
             <CreditCard className="text-primary" size={18} /> Encaissement
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Colonne 1 : Résumé & Méthodes */}
            <div className="space-y-4">
            {/* Résumé montants */}
            <div className="bg-muted rounded-xl p-2 border border-border space-y-1">
                <div className="flex justify-between items-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>Sous-total</span>
                    <span>{formatAmount(orderType === 'gozem' ? total : subtotal)}</span>
                </div>
                {promoActive && promoRate > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        <span>Promotion ({promoRate}%)</span>
                        <span>-{formatAmount(Math.round(subtotal * promoRate / 100))}</span>
                    </div>
                )}
                {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        <span>
                            {orderType === 'gozem' 
                                ? `Remise Gozem (${gozemRate}%)` 
                                : (discount.type === 'percent' 
                                    ? `Remise (${discount.value}%)${discount.reason ? ` [${discount.reason}]` : ''}` 
                                    : `Remise${discount.reason ? ` [${discount.reason}]` : ''}`)}
                        </span>
                        <span>-{formatAmount(orderType === 'gozem' ? Math.round(subtotal * gozemRate / 100) : (discountAmount - (promoActive ? Math.round(subtotal * promoRate / 100) : 0)))}</span>
                    </div>
                )}
                <div className="pt-1.5 mt-0.5 border-t border-border flex flex-col items-center">
                    <p className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-[0.2em] mb-0.5">Total TTC</p>
                    <h2 className="text-xl font-black text-foreground italic tracking-tighter">
                        {formatAmount(total)}
                    </h2>
                </div>
                {vatAmount > 0 && (
                    <div className="flex justify-center text-[8px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                        <span>Dont TVA ({vatRate}%) : {formatAmount(vatAmount)}</span>
                    </div>
                )}

                {/* Bouton pour ajouter une remise */}
                {orderType !== 'gozem' && (
                    <div className="pt-2">
                        {!showDiscount ? (
                            <button 
                                onClick={() => setShowDiscount(true)}
                                className="w-full py-1.5 flex items-center justify-center gap-2 border border-dashed border-primary/30 rounded-lg text-[8px] font-black uppercase text-primary hover:bg-primary/5 transition-all"
                            >
                                <TagIcon size={10} /> Appliquer une remise
                            </button>
                        ) : (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black uppercase text-primary flex items-center gap-1">
                                        <ShieldCheck size={10} /> Autorisation Requise
                                    </span>
                                    <button onClick={() => setShowDiscount(false)} className="text-[10px] text-muted-foreground hover:text-foreground">×</button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[7px] font-black uppercase text-muted-foreground ml-1">Type</Label>
                                        <div className="flex bg-muted rounded-lg p-0.5 border border-border">
                                            <button 
                                                onClick={() => setTempDiscount({...tempDiscount, type: 'percent'})}
                                                className={cn(
                                                    "flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all", 
                                                    tempDiscount.type === 'percent' 
                                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                                        : "text-muted-foreground hover:bg-background/50"
                                                )}
                                            >
                                                %
                                            </button>
                                            <button 
                                                onClick={() => setTempDiscount({...tempDiscount, type: 'fixed'})}
                                                className={cn(
                                                    "flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all", 
                                                    tempDiscount.type === 'fixed' 
                                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                                        : "text-muted-foreground hover:bg-background/50"
                                                )}
                                            >
                                                FCFA
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[7px] font-black uppercase text-muted-foreground ml-1">Valeur</Label>
                                        <Input 
                                            type="number"
                                            value={tempDiscount.value}
                                            onChange={(e) => setTempDiscount({...tempDiscount, value: e.target.value})}
                                            className="h-7 bg-card text-[10px] font-bold"
                                            placeholder="Ex: 10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[7px] font-black uppercase text-muted-foreground ml-1">Motif</Label>
                                    <Input 
                                        value={tempDiscount.reason}
                                        onChange={(e) => setTempDiscount({...tempDiscount, reason: e.target.value})}
                                        className="h-7 bg-card text-[10px] font-bold"
                                        placeholder="Ex: Geste commercial"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[7px] font-black uppercase text-primary ml-1">Code PIN Manager</Label>
                                    <Input 
                                        type="password"
                                        value={discountPin}
                                        onChange={(e) => setDiscountPin(e.target.value)}
                                        className="h-7 bg-card text-center text-lg tracking-widest border-primary/30"
                                        placeholder="****"
                                        maxLength={6}
                                    />
                                </div>

                                <Button 
                                    size="sm" 
                                    className="w-full h-7 text-[8px] font-black uppercase tracking-widest"
                                    onClick={handleApplyDiscount}
                                    disabled={isApplyingDiscount || !tempDiscount.value || !discountPin}
                                >
                                    {isApplyingDiscount ? <Loader2 className="animate-spin mr-1" size={10} /> : <TagIcon className="mr-1" size={10} />}
                                    Appliquer
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Méthode de paiement */}
            <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Paiement</Label>
                {!isSessionOpen && !isLoadingSession && method === 'cash' && (
                <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse flex items-center gap-1">
                    <AlertTriangle size={10} /> Caisse fermée
                </span>
                )}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(pm => (
                <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMethod(pm.value)}
                    className={cn(
                    'flex items-center justify-center h-9 rounded-xl border transition-all',
                    method === pm.value
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    )}
                >
                    <span className="text-[9px] font-black uppercase">{pm.label}</span>
                </button>
                ))}
                
                {/* Ardoise Option */}
                <button
                    type="button"
                    onClick={() => setMethod('customer_tab')}
                    className={cn(
                    'flex items-center justify-center h-9 rounded-xl border transition-all',
                    method === 'customer_tab'
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    )}
                >
                    <span className="text-[9px] font-black uppercase tracking-tighter">Ardoise</span>
                </button>
            </div>
            </div>
            </div>

            {/* Colonne 2 : Détails & Validation */}
            <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
            {/* Montant reçu (espèces) */}
            {method === 'cash' && (
            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Reçu</Label>
                <Input
                    type="number"
                    value={received}
                    onChange={e => setReceived(e.target.value)}
                    placeholder={String(total)}
                    autoFocus
                    className="h-10 bg-muted border-border rounded-xl text-xl font-black text-center focus:ring-primary text-foreground"
                />
                {/* Boutons rapides */}
                <div className="flex gap-1.5 justify-center">
                {[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000].filter((v, i, a) => a.indexOf(v) === i && v >= total).map(v => (
                    <Button
                    key={v}
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceived(String(v))}
                    className="h-8 px-3 bg-muted border border-border text-muted-foreground hover:text-foreground rounded-lg text-[8px] font-black uppercase tracking-widest"
                    >
                    {formatAmount(v)}
                    </Button>
                ))}
                </div>
                {amountReceived >= total && (
                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex justify-between items-center animate-in slide-in-from-top-1">
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">À rendre</span>
                    <span className="text-base font-black text-emerald-500 italic">
                        {formatAmount(change)}
                    </span>
                </div>
                )}
            </div>
            )}

            {/* Référence (mobile money) */}
            {method !== 'cash' && method !== 'card' && method !== 'customer_tab' && (
            <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Réf. {paymentMethodLabel(method)}</Label>
                <Input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Transaction ID..."
                className="h-10 bg-muted border-border text-foreground rounded-xl text-sm font-bold text-center focus:ring-primary"
                />
            </div>
            )}

            {/* Ardoise Selection */}
            {method === 'customer_tab' && (
                <ArdoiseSelector onSelect={(id) => setReference(id)} selectedId={reference} />
            )}

            {/* Optional Customer Name */}
            <div className="space-y-1.5 pt-1">
                <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Nom du Client (Optionnel)</Label>
                <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Nom pour le suivi..."
                    className="h-10 bg-muted/60 border-border text-foreground rounded-xl text-xs font-bold focus:ring-primary"
                />
            </div>

            {/* Loyalty / Fidélité */}
            <div className="space-y-1.5 pt-1">
                <Label className="text-[9px] font-black uppercase text-primary ml-1 tracking-widest flex items-center gap-1">
                    <QrCode size={10} /> Carte Fidélité
                </Label>
                <Input
                    value={loyaltyToken}
                    onChange={e => setLoyaltyToken(e.target.value)}
                    placeholder="Scan QR ou N° Carte..."
                    className="h-10 bg-primary/5 border-primary/30 text-foreground rounded-xl text-xs font-bold focus:ring-primary"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 pb-1">
            <Button variant="ghost" onClick={onClose} className="flex-1 h-12 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest">
                Annuler
            </Button>
            <Button
                onClick={handlePay}
                disabled={!canPay || isLoading || isLoadingSession}
                className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                VALIDER ({formatAmount(total)})
            </Button>
            </div>
            {!isSessionOpen && method === 'cash' && (
            <p className="text-center text-[8px] text-red-500 font-black uppercase tracking-[0.2em] animate-pulse">
                * Session de caisse fermée
            </p>
            )}
            </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
