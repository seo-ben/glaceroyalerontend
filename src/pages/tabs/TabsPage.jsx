import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { CreditCard, Plus, Search, FileText, DollarSign, User, Phone, X, History, Trash2, CheckCircle2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { usePrint } from '@/hooks/usePrint';
import { Printer } from 'lucide-react';

export default function TabsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ first_name: '', last_name: '', phone: '', notes: '' });
    const isManager = useAuthStore(state => state.isManager());

    const { data: tabsData = [], isLoading } = useQuery({
        queryKey: ['customer-tabs', search],
        queryFn: () => apiClient.get(`/customer-tabs?search=${search}`).then(r => r.data),
    });

    const tabs = tabsData.data || [];

    const createTabMutation = useMutation({
        mutationFn: (data) => apiClient.post('/customer-tabs', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-tabs'] });
            toast({ title: "Ardoise créée", description: "Le compte est maintenant ouvert pour ce client" });
            setIsModalOpen(false);
            setNewClient({ first_name: '', last_name: '', phone: '', notes: '' });
        },
        onError: (err) => toast({ 
            title: "Erreur", 
            description: err.response?.data?.message || "Échec de la création",
            variant: "destructive"
        }),
    });

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <CreditCard size={20} className="text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Ardoises</h1>
                    </div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">
                        Comptes clients & Consommations à crédit
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-64 group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Nom ou téléphone..." 
                            className="h-10 pl-11 bg-muted border-border rounded-xl text-xs font-bold text-foreground placeholder:text-muted-foreground focus:ring-primary" 
                        />
                    </div>
                    {isManager && (
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all"
                        >
                            <Plus size={16} className="mr-2" /> Nouveau Client
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
                    </div>
                ) : tabs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/30 uppercase tracking-[0.3em] font-black">
                        <CreditCard size={64} className="mb-4 opacity-50" />
                        Aucune ardoise ouverte
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-border overflow-x-auto shadow-md">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-[8px] uppercase tracking-widest text-muted-foreground font-black">
                                    <th className="py-2.5 px-4 pl-6">Client</th>
                                    <th className="py-2.5 px-4">Contact</th>
                                    <th className="py-2.5 px-4">Com.</th>
                                    <th className="py-2.5 px-4 text-center">Statut</th>
                                    <th className="py-2.5 px-4 text-right">Reste à payer</th>
                                    <th className="py-2.5 px-4 text-center pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabs.map(tab => (
                                    <TabTableRow
                                        key={tab.id} 
                                        tab={tab} 
                                        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['customer-tabs'] })} 
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-4 bg-muted/40">
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                            Ouvrir un Compte Client
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prénom</Label>
                                <Input 
                                    value={newClient.first_name}
                                    onChange={e => setNewClient({...newClient, first_name: e.target.value})}
                                    className="h-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom *</Label>
                                <Input 
                                    value={newClient.last_name}
                                    onChange={e => setNewClient({...newClient, last_name: e.target.value})}
                                    className="h-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Numéro de Téléphone *</Label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                                <Input 
                                    value={newClient.phone}
                                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                                    placeholder="+228 XX XX XX XX"
                                    className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" 
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <Button variant="ghost" className="flex-1 h-12 text-muted-foreground hover:text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest border border-border rounded-2xl" onClick={() => setIsModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button 
                                onClick={() => createTabMutation.mutate(newClient)}
                                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20" 
                                disabled={createTabMutation.isPending || !newClient.last_name || !newClient.phone}
                            >
                                Ouvrir le Compte
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TabTableRow({ tab, onRefresh }) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { printTabNetwork } = usePrint();
    
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    
    const payMutation = useMutation({
        mutationFn: (data) => apiClient.post(`/customer-tabs/${tab.id}/pay`, data),
        onSuccess: () => {
            onRefresh();
            toast({ title: "Paiement enregistré", description: "L'ardoise a été mise à jour" });
            
            // Impression automatique du reçu après encaissement
            printTabNetwork(tab.id).catch(err => console.error("Auto print error", err));
            
            window.open(`${import.meta.env.VITE_API_URL}/customer-tabs/${tab.id}/invoice`, '_blank');
        },
        onError: (err) => toast({ 
            title: "Erreur", 
            description: err.response?.data?.message || "Échec du paiement", 
            variant: "destructive" 
        }),
    });

    const handlePaySubmit = (payload) => {
        payMutation.mutate(payload);
        setPaymentModalOpen(false);
    };

    const remaining = tab.total_amount - (tab.paid_amount || 0);

    return (
        <>
        <tr className="border-b border-border hover:bg-muted/50 transition-colors group">
            <td className="py-2 px-4 pl-6 align-middle">
                <div>
                   <p className="text-xs font-black text-foreground uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                       {tab.first_name} {tab.last_name}
                   </p>
                   <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-widest hidden sm:block leading-none">
                      Créé le {format(new Date(tab.opened_at), 'dd/MM/yy', { locale: fr })}
                   </p>
                </div>
            </td>
            <td className="py-2 px-4 text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase align-middle">
                <div className="flex items-center gap-1.5 leading-none"><Phone size={10} className="text-muted-foreground/50" /> {tab.phone}</div>
            </td>
            <td className="py-2 px-4 text-[9px] font-black text-muted-foreground/60 tracking-widest uppercase align-middle">
                {tab.orders_count || 0} Com.
            </td>
            <td className="py-2 px-4 text-center align-middle">
                <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase px-1.5 py-0 rounded-md border",
                    remaining <= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                )}>
                    {remaining <= 0 ? 'Soldé' : 'En dette'}
                </Badge>
            </td>
            <td className="py-2 px-4 text-right align-middle">
                <p className={cn("text-sm font-black italic tracking-tighter mb-0 leading-none", remaining <= 0 ? "text-emerald-500" : "text-foreground")}>
                    {remaining <= 0 ? '0 FCFA' : formatAmount(remaining)}
                </p>
            </td>
            <td className="py-2 px-4 pr-6 flex items-center justify-end gap-1.5 align-middle">
                <Button 
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border"
                    onClick={() => navigate(`/tabs/${tab.id}`)}
                >
                    <Eye size={12} />
                </Button>
                <Button 
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border"
                    title="Facture A4 (PDF)"
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}/customer-tabs/${tab.id}/invoice`, '_blank')}
                >
                    <FileText size={12} />
                </Button>
                <Button 
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                    title="Imprimer Relevé (IP)"
                    onClick={async () => {
                        try {
                            await printTabNetwork(tab.id);
                            toast({ title: "Impression", description: "Impression réseau lancée." });
                        } catch (err) {
                            toast({ title: "Erreur", description: "L'impression a échoué (IP non configuré).", variant: "destructive" });
                        }
                    }}
                >
                    <Printer size={12} />
                </Button>
                {remaining > 0 && (
                    <Button 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-black uppercase text-[8px] tracking-widest h-7 px-2.5 shadow-lg shadow-emerald-600/10 transition-all"
                        onClick={() => setPaymentModalOpen(true)}
                        disabled={payMutation.isPending}
                    >
                        <DollarSign size={10} className="mr-1" /> Encaisser
                    </Button>
                )}
            </td>
        </tr>
        
        {paymentModalOpen && (
            <TabPaymentDialog 
                tab={tab} 
                remainingAmount={remaining}
                onClose={() => setPaymentModalOpen(false)} 
                onSubmit={handlePaySubmit} 
                isLoading={payMutation.isPending}
            />
        )}
        </>
    );
}

function TabPaymentDialog({ tab, remainingAmount, onClose, onSubmit, isLoading }) {
    const [amount, setAmount] = useState(remainingAmount.toString());
    const [method, setMethod] = useState('cash');

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-sm bg-card border-border text-foreground rounded-[2rem] p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-muted/40 border-b border-border">
                    <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-emerald-500 flex items-center gap-2">
                        <DollarSign size={18} /> Encaisser l'Ardoise
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Client</Label>
                        <div className="text-sm font-bold bg-muted p-3 rounded-xl border border-border">
                            {tab.first_name} {tab.last_name}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reste à payer</Label>
                            <div className="text-xs font-black text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                {formatAmount(remainingAmount)}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-emerald-500 ml-1">Montant à encaisser *</Label>
                            <Input 
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="h-11 bg-muted border-emerald-500/30 rounded-xl text-xs font-bold focus:ring-emerald-500 text-foreground" 
                                min={0}
                                max={remainingAmount}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Moyen de paiement *</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="h-11 bg-muted border-border rounded-xl text-xs font-bold text-foreground focus:ring-emerald-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground rounded-xl font-bold">
                                <SelectItem value="cash">Espèces</SelectItem>
                                <SelectItem value="moov">Moov Money</SelectItem>
                                <SelectItem value="mixx">Mixx (Tmoney)</SelectItem>
                                <SelectItem value="wave">Wave</SelectItem>
                                <SelectItem value="orange_money">Orange Money</SelectItem>
                                <SelectItem value="momo">MTN MoMo</SelectItem>
                                <SelectItem value="card">Carte Bancaire</SelectItem>
                                <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="ghost" className="flex-1 h-11 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest border border-border rounded-xl" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button 
                            onClick={() => onSubmit({ amount: Number(amount), payment_method: method })}
                            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl shadow-emerald-600/20" 
                            disabled={isLoading || Number(amount) <= 0 || Number(amount) > remainingAmount}
                        >
                            Valider
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
