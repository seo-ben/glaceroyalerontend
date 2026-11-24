import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Banknote, CreditCard, Smartphone, Wallet, CheckCircle } from 'lucide-react';
import { formatAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function CakePaymentModal({ open, order, onClose, onSubmit, isLoading }) {
    const [method, setMethod] = useState('cash');
    const [reference, setReference] = useState('');
    if (!order) return null;
    
    const totalPrice = parseFloat(
        order.total_price || 
        order.total || 
        order.items?.[0]?.unit_price || 
        order.items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) ||
        0
    );
    const alreadyPaid = parseFloat(order.advance_paid || order.amount_paid || 0);
    const balance = Math.max(0, totalPrice - alreadyPaid);

    const needsReference = method !== 'cash' && method !== 'card';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="md:max-w-[700px] max-w-[95vw] w-full max-h-[90vh] bg-card border-border text-foreground rounded-[2rem] p-0 flex flex-col overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-muted/40 border-b border-border shrink-0">
                    <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                        Encaisser Solde Gâteau
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        {/* Colonne 1 : Résumé & Méthodes */}
                        <div className="space-y-4">
                            <div className="text-center p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <div className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Reste à payer</div>
                                <div className="text-2xl font-black italic tracking-tighter text-foreground">
                                    {formatAmount(balance)}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Mode de paiement</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_METHODS.map(pm => {
                                        return (
                                            <button
                                                key={pm.value}
                                                onClick={() => { setMethod(pm.value); setReference(''); }}
                                                className={cn(
                                                    "flex items-center justify-center h-9 rounded-xl border-2 transition-all",
                                                    method === pm.value 
                                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 text-primary" 
                                                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
                                                )}
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-tighter">{pm.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Colonne 2 : Détails & Validation */}
                        <div className="space-y-4 flex flex-col justify-between">
                            <div className="space-y-4">
                                {needsReference && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">
                                            Réf. Transaction
                                        </Label>
                                        <Input
                                            value={reference}
                                            onChange={e => setReference(e.target.value)}
                                            placeholder="ID de transaction..."
                                            className="h-11 bg-muted border-border rounded-2xl text-sm font-bold text-center text-foreground focus:ring-primary"
                                        />
                                    </div>
                                )}
                            </div>

                            <Button 
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-95"
                                disabled={isLoading || (needsReference && reference.length < 3)}
                                onClick={() => onSubmit({ order_id: order.id, method, amount: balance, reference: reference || null })}
                            >
                                {isLoading ? 'TRAITEMENT...' : 'VALIDER LE PAIEMENT'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
