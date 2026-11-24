import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { 
    ChevronLeft, CreditCard, DollarSign, FileText, 
    Calendar, Phone, User, ShoppingBag, Receipt, 
    ArrowRight, CheckCircle2, Clock, AlertCircle,
    Edit, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { usePrint } from '@/hooks/usePrint';
import { Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function TabDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { printTabNetwork } = usePrint();
    const queryClient = useQueryClient();
    const isManager = useAuthStore(state => state.isManager());

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editClient, setEditClient] = useState({ first_name: '', last_name: '', phone: '', notes: '' });
    
    const { data: tab, isLoading, error } = useQuery({
        queryKey: ['customer-tab', id],
        queryFn: () => apiClient.get(`/customer-tabs/${id}`).then(r => r.data),
    });

    const { mutate: updateTab, isPending: isUpdating } = useMutation({
        mutationFn: (data) => apiClient.put(`/customer-tabs/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-tab', id] });
            toast({ title: "Ardoise mise à jour", description: "Les informations du client ont été modifiées" });
            setIsEditModalOpen(false);
        },
        onError: (err) => toast({ 
            title: "Erreur", 
            description: err.response?.data?.message || "Échec de la modification", 
            variant: "destructive" 
        }),
    });

    const { mutate: detachOrder, isPending: isDetaching } = useMutation({
        mutationFn: (orderId) => apiClient.post(`/customer-tabs/${id}/detach`, { order_id: orderId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-tab', id] });
            toast({ title: "Commande détachée", description: "La commande a été retirée de l'ardoise et repasse en cours" });
        },
        onError: (err) => toast({ 
            title: "Erreur", 
            description: err.response?.data?.message || "Échec du détachement", 
            variant: "destructive" 
        }),
    });

    const handleDetach = (order) => {
        const orderPaid = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const confirmMsg = orderPaid > 0 
            ? `Êtes-vous sûr de vouloir détacher la commande ${order.order_number} ?\n\nAttention : Cette commande a ${formatAmount(orderPaid)} de paiements enregistrés. Ces paiements seront supprimés et déduits de l'ardoise.`
            : `Êtes-vous sûr de vouloir détacher la commande ${order.order_number} de cette ardoise ?`;
            
        if (window.confirm(confirmMsg)) {
            detachOrder(order.id);
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full" />
            </div>
        );
    }

    if (error || !tab) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle size={48} className="text-red-500 opacity-50" />
                <h2 className="text-xl font-bold text-foreground">Ardoise introuvable</h2>
                <Button onClick={() => navigate('/tabs')} variant="outline">Retour aux ardoises</Button>
            </div>
        );
    }

    const remaining = tab.total_amount - (tab.paid_amount || 0);

    // Grouping all payments from all orders
    const allPayments = tab.orders?.flatMap(order => 
        order.payments?.map(payment => ({
            ...payment,
            order_number: order.order_number
        }))
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Back */}
            <header className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border"
                    onClick={() => navigate('/tabs')}
                >
                    <ChevronLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none">
                        Détails de l'Ardoise
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                        Client: {tab.first_name} {tab.last_name}
                    </p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Button 
                        onClick={async () => {
                            try {
                                await printTabNetwork(tab.id);
                                toast({ title: "Impression", description: "Impression réseau lancée." });
                            } catch (err) {
                                toast({ title: "Erreur", description: "L'impression a échoué (IP non configuré).", variant: "destructive" });
                            }
                        }}
                        className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <Printer size={16} className="mr-2" /> Imprimer Relevé (IP)
                    </Button>
                    <Button 
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/customer-tabs/${tab.id}/invoice`, '_blank')}
                        className="h-10 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl px-4 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        <FileText size={16} className="mr-2" /> Télécharger Facture Globale
                    </Button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-md relative">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Client</p>
                                <p className="text-lg font-black text-foreground italic tracking-tighter truncate mt-1">
                                    {tab.first_name} {tab.last_name}
                                </p>
                                <p className="text-[10px] font-bold text-indigo-400 mt-0.5">{tab.phone}</p>
                                {tab.notes && (
                                    <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/50 pt-2 italic line-clamp-2" title={tab.notes}>
                                        Note : {tab.notes}
                                    </p>
                                )}
                            </div>
                            {isManager && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-7 h-7 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border shrink-0 ml-2"
                                    onClick={() => {
                                        setEditClient({
                                            first_name: tab.first_name || '',
                                            last_name: tab.last_name || '',
                                            phone: tab.phone || '',
                                            notes: tab.notes || ''
                                        });
                                        setIsEditModalOpen(true);
                                    }}
                                >
                                    <Edit size={12} />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>


                <Card className="bg-indigo-600/10 border-indigo-500/20 rounded-3xl overflow-hidden shadow-2xl relative">
                    <CardContent className="p-5 text-indigo-400">
                        <ShoppingBag className="absolute top-4 right-4 text-indigo-400/10" size={32} />
                        <p className="text-[10px] font-black uppercase text-indigo-400/50 tracking-widest">Total Consommé</p>
                        <p className="text-2xl font-black italic tracking-tighter mt-1">
                            {formatAmount(tab.total_amount)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-3xl overflow-hidden shadow-2xl relative">
                    <CardContent className="p-5 text-emerald-500">
                        <DollarSign className="absolute top-4 right-4 text-emerald-500/10" size={32} />
                        <p className="text-[10px] font-black uppercase text-emerald-500/50 tracking-widest">Total Payé</p>
                        <p className="text-2xl font-black italic tracking-tighter mt-1">
                            {formatAmount(tab.paid_amount)}
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-3xl overflow-hidden shadow-2xl relative border",
                    remaining > 0 ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}>
                    <CardContent className="p-5">
                        <Clock className="absolute top-4 right-4 opacity-10" size={32} />
                        <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Reste à Payer</p>
                        <p className="text-2xl font-black italic tracking-tighter mt-1">
                            {remaining > 0 ? formatAmount(remaining) : 'SOLDÉ'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* List & Tabs */}
            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="bg-muted border-border p-1 rounded-2xl gap-1">
                    <TabsTrigger value="orders" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <ShoppingBag size={14} className="mr-2" /> Commandes
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-xl font-black uppercase text-[10px] tracking-widest py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Receipt size={14} className="mr-2" /> Historique Paiements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-4">
                    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-md">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-[9px] uppercase tracking-widest text-muted-foreground font-black">
                                    <th className="py-4 px-6">ID / Date</th>
                                    <th className="py-4 px-4">Localisation</th>
                                    <th className="py-4 px-4">Nb Articles</th>
                                    <th className="py-4 px-4 text-right">Montant</th>
                                    <th className="py-4 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tab.orders?.map(order => (
                                    <tr key={order.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="py-3 px-6">
                                            <p className="text-[11px] font-black text-foreground italic tracking-tighter uppercase">{order.order_number}</p>
                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase mt-1">
                                                <Calendar size={10} />
                                                {format(new Date(order.created_at), 'dd MMMM yyyy HH:mm', { locale: fr })}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {order.table ? (
                                                <Badge className="bg-muted text-muted-foreground border-border font-bold text-[9px] px-2 py-0">Table {order.table.number}</Badge>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Vente Directe</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs font-bold text-muted-foreground">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <p className="text-sm font-black text-foreground italic tracking-tighter">
                                                {formatAmount(order.total)}
                                            </p>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors"
                                                    title="Voir la commande"
                                                    onClick={() => navigate(`/orders/${order.id}`)}
                                                >
                                                    <ArrowRight size={14} />
                                                </Button>
                                                {isManager && tab.status !== 'cancelled' && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                                                        title="Détacher la commande"
                                                        onClick={() => handleDetach(order)}
                                                        disabled={isDetaching}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {(!tab.orders || tab.orders.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground/50 uppercase tracking-[0.2em] font-black">
                                            Aucune commande liée
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-md">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-[9px] uppercase tracking-widest text-muted-foreground font-black">
                                    <th className="py-4 px-6">Date du Règlement</th>
                                    <th className="py-4 px-4 text-center">Mode</th>
                                    <th className="py-4 px-4">Commande Réf.</th>
                                    <th className="py-4 px-4">Note / Réf</th>
                                    <th className="py-4 px-6 text-right">Montant Encaissé</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <p className="text-[11px] font-bold text-foreground">
                                                {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: fr })}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                                à {format(new Date(payment.created_at), 'HH:mm')}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <Badge className={cn(
                                                "font-black uppercase text-[8px] px-2 py-0.5 tracking-wider",
                                                payment.method === 'cash' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                            )}>
                                                {payment.method === 'cash' ? 'ESPECES' : payment.method?.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-[10px] font-black text-muted-foreground italic tracking-tighter uppercase">
                                                {payment.order_number}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                {payment.reference || '--'}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <p className="text-base font-black text-emerald-500 italic tracking-tighter">
                                                +{formatAmount(payment.amount)}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                                {allPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground/50 uppercase tracking-[0.2em] font-black">
                                            Aucun versement effectué
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal de modification client */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-4 bg-muted/40">
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                            Modifier le Client
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prénom</Label>
                                <Input 
                                    value={editClient.first_name}
                                    onChange={e => setEditClient({...editClient, first_name: e.target.value})}
                                    className="h-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom *</Label>
                                <Input 
                                    value={editClient.last_name}
                                    onChange={e => setEditClient({...editClient, last_name: e.target.value})}
                                    className="h-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Numéro de Téléphone *</Label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                                <Input 
                                    value={editClient.phone}
                                    onChange={e => setEditClient({...editClient, phone: e.target.value})}
                                    placeholder="+228 XX XX XX XX"
                                    className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Notes / Informations complémentaires</Label>
                            <Textarea 
                                value={editClient.notes || ''}
                                onChange={e => setEditClient({...editClient, notes: e.target.value})}
                                placeholder="Notes sur le client..."
                                className="bg-muted border-border rounded-2xl text-xs font-bold focus:ring-primary text-foreground min-h-[80px]" 
                            />
                        </div>
                        <div className="flex gap-3 pt-6">
                            <Button variant="ghost" className="flex-1 h-12 text-muted-foreground hover:text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest border border-border rounded-2xl" onClick={() => setIsEditModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button 
                                onClick={() => updateTab(editClient)}
                                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20" 
                                disabled={isUpdating || !editClient.last_name || !editClient.phone}
                            >
                                Enregistrer
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

