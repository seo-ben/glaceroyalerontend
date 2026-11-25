import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Cookie, Plus, Search, Calendar, CheckCircle, Printer, Clock, User, Phone, Edit3, Trash2, X, CreditCard, Banknote, Wallet, Smartphone, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { printHtml } from '@/lib/print';
import { generateCakeTicketHTML } from '@/lib/cakeTicket';
import { downloadCakeReceiptPDF } from '@/lib/cakeReceiptPdf';
import { settingsApi } from '@/api/settings';
import { paymentsApi } from '@/api/payments';
import { usePrint } from '@/hooks/usePrint';
import { printToLocalDevice } from '@/lib/localPrinting';
import CakePaymentModal from '@/components/cakes/CakePaymentModal';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function CakeOrdersPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const { printCakeNetwork, printNetworkReceipt } = usePrint();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [page, setPage] = useState(1);

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['cake-orders', page, searchQuery, selectedDate],
        queryFn: () => apiClient.get('/cake-orders', { 
            params: {
                page, 
                search: searchQuery || undefined,
                date: searchQuery ? undefined : selectedDate 
            } 
        }).then(r => r.data),
    });

    const { data: settingsData } = useQuery({
        queryKey: ['settings'],
        queryFn:  () => settingsApi.get().then(r => r.data),
    });

    const settings = settingsData?.settings || {};
    const orders = ordersData?.data || [];
    const pagination = {
        total: ordersData?.total || 0,
        current: ordersData?.current_page || 1,
        last: ordersData?.last_page || 1,
        hasPrev: page > 1,
        hasNext: ordersData?.last_page ? page < ordersData.last_page : false
    };

    const filteredOrders = orders; 

    React.useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedDate]);


    const saveMutation = useMutation({
        mutationFn: (data) => {
            // Transform simplified modal data to match backend requirements
            const parts = (data.delivery_date || '').split('T');
            const date = parts[0] || format(new Date(), 'yyyy-MM-dd');
            const time = parts[1] ? parts[1].substring(0, 5) : '12:00';
            const backendData = {
                customer_name:  data.customer_name,
                customer_phone: data.customer_phone,
                delivery_date:  date,
                delivery_time:  time,
                notes:          data.description, 
                advance_paid:   data.deposit_amount || 0,
                payment_method: data.payment_method || 'cash',
                items: [{
                    name: "Commande Divers",
                    qty: 1,
                    unit_price: data.total_price,
                    notes: data.description
                }]
            };
            
            return data.id 
                ? apiClient.put(`/cake-orders/${data.id}`, backendData) 
                : apiClient.post('/cake-orders', backendData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cake-orders'] });
            setIsModalOpen(false);
            setSelectedOrder(null);
            toast({ title: "Succès", description: "Commande enregistrée" });
        },
        onError: (err) => toast({ 
            title: "Erreur", 
            description: err.response?.data?.message || "Échec de l'opération", 
            variant: "destructive" 
        })
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => apiClient.patch(`/cake-orders/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cake-orders'] });
            toast({ title: "Statut mis à jour", description: "Le nouveau statut a été appliqué" });
        },
    });

    const payMutation = useMutation({
        mutationFn: (d) => apiClient.post(`/cake-orders/${d.order_id}/collect`, {
            payment_method: d.method,
            amount_paid: d.amount
        }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['cake-orders']);
            setIsPaymentModalOpen(false);
            setPaymentOrder(null);
            toast({ title: "Paiement encaissé", description: "Le solde a été réglé avec succès." });
            
            // Impression automatique sur l'imprimante de CAISSE
            if (res.data?.order?.id) {
                printCakeNetwork(res.data.order.id).catch(err => console.error("Auto print error", err));
            }
        },
        onError: (err) => toast({ description: err.response?.data?.message || "Erreur de paiement", variant: "destructive" })
    });

    const handlePrint = async (orderId) => {
        try {
            const response = await apiClient.get(`/cake-orders/${orderId}/ticket?format=html`);
            if (response.data?.html) {
                await printToLocalDevice(response.data.html, 'receipt', settings);
                toast({ title: "Impression", description: "Ticket divers envoyé à l'imprimante." });
            }
        } catch (err) {
            console.error("Print error", err);
            toast({ title: "Erreur", description: "L'impression a échoué.", variant: "destructive" });
        }
    };

    const handleDownloadPdf = async (order) => {
        try {
            const isPaid = order.is_paid || ((order.total_price || order.total || 0) - (order.advance_paid || 0)) <= 0;
            const response = await apiClient.get(`/cake-orders/${order.id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const defaultFilename = isPaid 
                ? `Facture_${order.order_number || order.id}.pdf` 
                : `Confirmation_Divers_${order.order_number || order.id}.pdf`;
            link.setAttribute('download', defaultFilename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({ 
                title: "PDF Généré", 
                description: isPaid ? "Facture A4 téléchargée avec succès." : "Bon de commande A4 téléchargé avec succès." 
            });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de générer le PDF.", variant: "destructive" });
        }
    };

    return (
        <div className="h-full lg:h-[calc(100vh-140px)] flex flex-col gap-4 lg:gap-6 animate-fade-in overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <div className="flex flex-col gap-1">
                        <Badge className="w-fit bg-primary/10 text-primary border-none px-2 mb-1 text-[8px] font-black uppercase tracking-widest leading-none">Pâtisserie & Événements</Badge>
                        <div className="flex items-center gap-3">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Cookie size={18} className="text-primary-foreground" />
                            </div>
                            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tighter uppercase italic">Divers</h1>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                    {/* Filtre par Date */}
                    <div className="relative flex items-center">
                        <Calendar size={14} className="absolute left-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="h-10 lg:h-11 pl-11 pr-3 bg-muted border-border rounded-2xl text-[10px] font-black text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer uppercase italic"
                        />
                    </div>

                    <div className="relative w-full md:w-64 lg:w-72 group">
                        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="RECHERCHER..." 
                            className="h-10 lg:h-11 pl-10 bg-muted border-border rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-foreground placeholder:text-muted-foreground focus:ring-primary italic" 
                        />
                    </div>
                    <Button 
                        onClick={() => { setSelectedOrder(null); setIsModalOpen(true); }}
                        className="flex-1 md:flex-none h-10 lg:h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-4 lg:px-6 font-black uppercase text-[9px] lg:text-[10px] tracking-widest shadow-xl shadow-primary/10 active:scale-95 transition-all"
                    >
                        <Plus size={14} className="mr-2" /> NOUVEAU PROJET
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-3xl animate-pulse" />)}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground uppercase tracking-[0.3em] font-black">
                        <Cookie size={64} className="mb-4 opacity-50" />
                        Aucune commande trouvée
                    </div>
                ) : (
                    <div className="space-y-4 pb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2 text-left">
                                <thead>
                                    <tr className="text-muted-foreground font-black uppercase text-[9px] tracking-wider">
                                        <th className="py-1 px-4">Client</th>
                                        <th className="py-1 px-3">Livraison</th>
                                        <th className="py-1 px-3 text-right">Total</th>
                                        <th className="py-1 px-3 text-right">Acompte</th>
                                        <th className="py-1 px-3 text-right">Reste</th>
                                        <th className="py-1 px-3 text-center">Statut</th>
                                        <th className="py-1 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => {
                                        const totalPrice = order.total_price || order.total || 0;
                                        const advancePaid = order.advance_paid || 0;
                                        const balance = Math.max(0, totalPrice - advancePaid);
                                        const statusConfig = {
                                            pending:   { label: 'Attente',     color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20' },
                                            preparing: { label: 'Préparation', color: 'text-orange-500',  bg: 'bg-orange-500/10 border-orange-500/20' },
                                            ready:     { label: 'Prêt',        color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/20' },
                                            collected: { label: 'Livré',       color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                                        };
                                        const config = statusConfig[order.status] || statusConfig.pending;

                                        return (
                                            <tr key={order.id} className="group bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-muted/30 transition-all shadow-sm">
                                                {/* Client (1 Ligne avec rounded-l-2xl) */}
                                                <td className="py-2.5 px-4 rounded-l-2xl border-y border-l whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-black uppercase italic tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                            {order.customer_name}
                                                        </span>
                                                        {order.customer_phone && (
                                                            <span className="text-[10px] font-bold text-muted-foreground tracking-tight">
                                                                • {order.customer_phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Livraison (1 Ligne) */}
                                                <td className="py-2.5 px-3 border-y whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                                                        <span>{format(new Date(order.delivery_date), 'dd MMM yyyy', { locale: fr })}</span>
                                                        <span className="text-muted-foreground text-[10px]">•</span>
                                                        <span className="text-primary font-black text-[10px]">{order.delivery_time?.substring(0, 5) || '12:00'}</span>
                                                    </div>
                                                </td>

                                                {/* Total */}
                                                <td className="py-2.5 px-3 border-y text-right whitespace-nowrap">
                                                    <span className="text-xs font-black tabular-nums text-foreground">
                                                        {formatAmount(totalPrice)}
                                                    </span>
                                                </td>

                                                {/* Acompte */}
                                                <td className="py-2.5 px-3 border-y text-right whitespace-nowrap">
                                                    <span className="text-xs font-bold tabular-nums text-emerald-600">
                                                        {formatAmount(advancePaid)}
                                                    </span>
                                                </td>

                                                {/* Reste */}
                                                <td className="py-2.5 px-3 border-y text-right whitespace-nowrap">
                                                    <span className={cn("text-xs font-black tabular-nums italic", balance > 0 ? "text-primary" : "text-muted-foreground/60")}>
                                                        {formatAmount(balance)}
                                                    </span>
                                                </td>

                                                {/* Statut (Micro Badges sur 1 Ligne) */}
                                                <td className="py-2.5 px-3 border-y text-center whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-md border", config.bg, config.color)}>
                                                            {config.label}
                                                        </Badge>
                                                        {balance > 0 ? (
                                                            <Badge className="bg-red-500/10 text-red-600 border border-red-500/30 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md">NON SOLDÉ</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md">PAYÉ</Badge>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions (Toolbar compacte 1 Ligne avec rounded-r-2xl) */}
                                                <td className="py-2.5 px-4 rounded-r-2xl border-y border-r text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {balance > 0 && (
                                                            <Button 
                                                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase text-[9px] tracking-wider h-7 px-2.5 shadow-sm transition-all border border-emerald-500 flex items-center gap-1"
                                                                onClick={() => { setPaymentOrder(order); setIsPaymentModalOpen(true); }}
                                                            >
                                                                <Banknote size={12} /> ENCAISSER
                                                            </Button>
                                                        )}

                                                        <div className="flex gap-0.5">
                                                            {order.status === 'pending' && (
                                                                <Button className="bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-500/30 rounded-lg font-black uppercase text-[8px] h-7 px-2 transition-all" onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'preparing' })}>PREP</Button>
                                                            )}
                                                            {order.status === 'preparing' && (
                                                                <Button className="bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-500/30 rounded-lg font-black uppercase text-[8px] h-7 px-2 transition-all" onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'ready' })}>PRÊT</Button>
                                                            )}
                                                            {order.status === 'ready' && (
                                                                <Button className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg font-black uppercase text-[8px] h-7 px-2 transition-all" onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'collected' })}>SORTI</Button>
                                                            )}
                                                        </div>

                                                        <Button 
                                                            variant="ghost" size="icon"
                                                            className="rounded-lg w-7 h-7 bg-primary/5 hover:bg-primary/20 text-primary transition-all border border-primary/20"
                                                            title="Imprimer Reçu (Thermique)"
                                                            onClick={() => handlePrint(order.id)}
                                                        >
                                                            <Printer size={12} />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" size="icon"
                                                            className={cn(
                                                                "rounded-lg w-7 h-7 transition-all border",
                                                                balance <= 0 ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20" : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                                                            )}
                                                            title={balance <= 0 ? "Facture A4 (PDF)" : "Bon de Commande A4 (PDF)"}
                                                            onClick={() => handleDownloadPdf(order)}
                                                        >
                                                            <FileDown size={12} />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" size="icon"
                                                            className="rounded-lg w-7 h-7 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
                                                            title="Éditer Commande"
                                                            onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                                                        >
                                                            <Edit3 size={12} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination UI */}
                        {pagination.last > 1 && (
                            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-muted/30 border border-border rounded-2xl">
                                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                    Page {pagination.current} sur {pagination.last} ({pagination.total} commandes)
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={!pagination.hasPrev}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="h-8 rounded-xl font-black uppercase text-[9px] tracking-widest border-border hover:bg-muted"
                                    >
                                        Précédent
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={!pagination.hasNext}
                                        onClick={() => setPage(p => Math.min(pagination.last, p + 1))}
                                        className="h-8 rounded-xl font-black uppercase text-[9px] tracking-widest border-border hover:bg-muted"
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CakeOrderModal 
                open={isModalOpen} 
                order={selectedOrder}
                onClose={() => { setIsModalOpen(false); setSelectedOrder(null); }}
                onSubmit={(d) => saveMutation.mutate(d)}
                isLoading={saveMutation.isPending}
            />

            <CakePaymentModal 
                open={isPaymentModalOpen}
                order={paymentOrder}
                onClose={() => { setIsPaymentModalOpen(false); setPaymentOrder(null); }}
                onSubmit={(data) => payMutation.mutate(data)}
                isLoading={payMutation.isPending}
            />
        </div>
    );
}


function CakeOrderModal({ open, order, onClose, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        description: '',
        delivery_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        total_price: '',
        deposit_amount: '',
        payment_method: 'cash',
    });

    React.useEffect(() => {
        if (order) {
            let dt = '';
            if (order.delivery_date) {
                // Extrait 'YYYY-MM-DD' peu importe si c'est 'YYYY-MM-DD 00:00:00' ou 'YYYY-MM-DDTHH:mm...'
                dt = String(order.delivery_date).split('T')[0].split(' ')[0].substring(0, 10);
            } else {
                dt = format(new Date(), "yyyy-MM-dd");
            }

            let ts = '12:00';
            if (order.delivery_time) {
                ts = String(order.delivery_time).substring(0, 5);
            } else if (order.delivery_date && String(order.delivery_date).includes(' ')) {
                const parts = String(order.delivery_date).split(' ')[1];
                if (parts) ts = parts.substring(0, 5);
            }

            setFormData({
                id: order.id,
                customer_name: order.customer_name || '',
                customer_phone: order.customer_phone || '',
                description: order.notes || (order.items?.[0]?.notes ?? ''),
                delivery_date: `${dt}T${ts}`,
                total_price: order.total || order.total_price || 0,
                deposit_amount: order.advance_paid || 0,
                payment_method: order.payment_method || 'cash',
            });
        } else {
            setFormData({
                customer_name: '',
                customer_phone: '',
                description: '',
                delivery_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                total_price: '',
                deposit_amount: '',
                payment_method: 'cash',
            });
        }
    }, [order, open]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] bg-card border-border text-foreground rounded-[2rem] p-0 flex flex-col overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-muted/40 border-b border-border shrink-0">
                    <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                        {order ? 'Éditer Commande Divers' : 'Nouvelle Commande Divers'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom Client</Label>
                            <div className="relative">
                                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                <Input 
                                    value={formData.customer_name}
                                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                                    className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold text-foreground focus:ring-primary" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Téléphone</Label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                <Input 
                                    value={formData.customer_phone}
                                    onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                                    className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold text-foreground focus:ring-primary" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description & Détails</Label>
                        <Textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Taille, saveur, texte à écrire, décoration..."
                            className="bg-muted border-border rounded-2xl text-xs font-medium text-foreground focus:ring-primary min-h-[90px]"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Date & Heure Livraison</Label>
                            <div className="relative">
                                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                <Input 
                                    type="datetime-local"
                                    value={formData.delivery_date}
                                    onChange={e => setFormData({...formData, delivery_date: e.target.value})}
                                    className="h-11 pl-11 bg-muted border-border rounded-2xl text-xs font-bold text-foreground focus:ring-primary" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prix Total</Label>
                            <Input 
                                type="number"
                                value={formData.total_price}
                                onChange={e => setFormData({...formData, total_price: Number(e.target.value)})}
                                className="h-11 bg-muted border-border rounded-2xl text-xs font-black text-center text-foreground focus:ring-primary" 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Acompte (Versé)</Label>
                            <Input 
                                type="number"
                                value={formData.deposit_amount}
                                onChange={e => setFormData({...formData, deposit_amount: Number(e.target.value)})}
                                placeholder="0"
                                className="h-11 bg-muted border-border rounded-2xl text-xs font-black text-center text-foreground focus:ring-primary" 
                            />
                        </div>
                        
                        {Number(formData.deposit_amount) > 0 && (
                            <div className="space-y-1.5 pt-1">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mode de paiement de l'acompte</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                    {PAYMENT_METHODS.map(pm => (
                                        <button 
                                            key={pm.value}
                                            type="button"
                                            onClick={() => setFormData({...formData, payment_method: pm.value})}
                                            className={cn(
                                                "h-10 px-2 rounded-xl text-[9px] font-black uppercase transition-all border flex items-center justify-center gap-1.5",
                                                formData.payment_method === pm.value 
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                                    : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                                            )}
                                        >
                                            <span className="text-xs">{pm.icon}</span>
                                            <span className="truncate">{pm.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Fixe */}
                <div className="p-4 px-6 bg-muted/20 border-t border-border flex gap-3 shrink-0">
                    <Button type="button" variant="ghost" className="flex-1 h-11 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl" onClick={onClose}>
                        Fermer
                    </Button>
                    <Button 
                        onClick={() => onSubmit(formData)}
                        className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20" 
                        disabled={isLoading}
                    >
                        {order ? 'Modifier Commande' : 'Enregistrer Projet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
