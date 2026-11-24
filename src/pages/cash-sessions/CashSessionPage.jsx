// Theme migrated Cash Session Page
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { sessionsApi } from '@/api/sessions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { formatAmount } from '@/lib/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PAYMENT_METHODS } from '@/lib/constants'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  CheckCircle2, Unlock, 
  Wallet, Printer, History, Receipt, ArrowUpDown, Pencil, Trash2, AlertTriangle, Calendar, X,
  Eye, EyeOff, Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { printToLocalDevice } from '@/lib/localPrinting'

export default function CashSessionPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const [openingAmount, setOpeningAmount] = useState('0')
  const [amountToBank, setAmountToBank]   = useState('')
  const [remainingAmount, setRemainingAmount] = useState('')
  const [closingNotes, setClosingNotes]   = useState('')
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [expenseData, setExpenseData]     = useState({ amount: '', category: 'purchases', notes: '', agent_name: '', beneficiary: '' })
  const [activeTab, setActiveTab]         = useState('current')
  const [editingExpense, setEditingExpense] = useState(null)
  const [editData, setEditData]           = useState({ amount: '', category: '', description: '', agent_name: '', beneficiary: '', notes: '' })
  const [deletingExpense, setDeletingExpense] = useState(null)
  const [expenseDateFilter, setExpenseDateFilter] = useState('')
  const [deleteReason, setDeleteReason]   = useState('')
  const { isAdmin, isManager, isCashier } = usePermissions()
  const canManageExpenses = isAdmin || isManager || isCashier

  const [showFinancials, setShowFinancials] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      setShowFinancials(true)
    }
  }, [isAdmin])
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [isValidatingPin, setIsValidatingPin] = useState(false)

  const handleValidateAdminPin = async () => {
    setIsValidatingPin(true)
    try {
      await apiClient.post('/auth/validate-admin-pin', { pin: adminPin })
      setShowFinancials(true)
      setIsAdminPinModalOpen(false)
      setAdminPin('')
      toast({ title: "Accès autorisé" })
    } catch (err) {
      toast({ title: "Échec", description: "PIN Admin incorrect", variant: "destructive" })
    } finally {
      setIsValidatingPin(false)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['current-session'],
    queryFn:  () => sessionsApi.current().then(r => r.data),
  })

  const { data: historyData } = useQuery({
    queryKey: ['sessions-history'],
    queryFn:  () => sessionsApi.list().then(r => r.data),
  })

  // Nouvelle requête pour la liste des dépenses
  const { data: expensesListData, isLoading: isExpListLoading } = useQuery({
    queryKey: ['all-expenses'],
    queryFn: () => apiClient.get('/expenses').then(r => r.data),
  })

  const { data: config } = useQuery({
    queryKey: ['settings-config'],
    queryFn: () => apiClient.get('/settings/config').then(r => r.data),
  })

  // PRÉ-REMPLISSAGE DU FOND INITIAL 
  useEffect(() => {
    const historyList = Array.isArray(historyData?.data) ? historyData.data : (Array.isArray(historyData) ? historyData : [])
    if (historyList.length > 0 && Number(openingAmount) === 0) {
        const lastSession = historyList[0];
        if (lastSession.remaining_amount) setOpeningAmount(String(Number(lastSession.remaining_amount)));
        else if (lastSession.closing_amount) setOpeningAmount(String(Number(lastSession.closing_amount)));
    }
  }, [historyData, openingAmount]);

  const history = Array.isArray(historyData?.data) ? historyData.data : (Array.isArray(historyData) ? historyData : [])
  const expensesList = Array.isArray(expensesListData?.data?.data) ? expensesListData.data.data : (Array.isArray(expensesListData?.data) ? expensesListData.data : [])

  // Filtrage des dépenses par date
  const filteredExpenses = expenseDateFilter
    ? expensesList.filter(exp => {
        const expDate = format(new Date(exp.created_at), 'yyyy-MM-dd')
        return expDate === expenseDateFilter
      })
    : expensesList
  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

  const getHistorySales = (session) => {
    return Number(session.total_sales || 0);
  };

  const openMut = useMutation({
    mutationFn: (amount) => sessionsApi.open(amount),
    onSuccess:  () => queryClient.invalidateQueries(['current-session']),
    onError: (err) => toast({ description: err.response?.data?.message || "Erreur ouverture" }),
  })

  const closeMut = useMutation({
    mutationFn: (d) => sessionsApi.close(data.session.id, d),
    onSuccess:  () => { 
        queryClient.invalidateQueries(['current-session']); 
        queryClient.invalidateQueries(['sessions-history']);
        toast({ title: "Session clôturée" }) 
    },
    onError: (err) => toast({ description: err.response?.data?.message || "Erreur clôture", variant: "destructive" }),
  })

  const expenseMut = useMutation({
    mutationFn: (d) => apiClient.post('/expenses', {
        ...d,
        description: d.notes || `Sortie ${d.category}`,
        payment_method: 'cash'
    }),
    onSuccess:  () => { 
        queryClient.invalidateQueries({ queryKey: ['current-session'] }); 
        queryClient.invalidateQueries({ queryKey: ['current-expenses'] });
        queryClient.invalidateQueries({ queryKey: ['all-expenses'] });
        setIsExpenseOpen(false); 
        setExpenseData({ amount: '', category: 'purchases', notes: '', agent_name: '', beneficiary: '' });
        toast({ title: "Dépense enregistrée" });
    },
    onError: (err) => toast({ title: "Échec", description: err.response?.data?.message || "Erreur", variant: "destructive" }),
  })

  const updateExpenseMut = useMutation({
    mutationFn: ({ id, ...d }) => apiClient.put(`/expenses/${id}`, d),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['current-session'] });
        queryClient.invalidateQueries({ queryKey: ['all-expenses'] });
        setEditingExpense(null);
        toast({ title: "Dépense modifiée" });
    },
    onError: (err) => toast({ title: "Échec", description: err.response?.data?.message || "Erreur", variant: "destructive" }),
  })

  const deleteExpenseMut = useMutation({
    mutationFn: ({ id, reason }) => apiClient.delete(`/expenses/${id}`, { data: { reason } }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['current-session'] });
        queryClient.invalidateQueries({ queryKey: ['all-expenses'] });
        setDeletingExpense(null);
        setDeleteReason('');
        toast({ title: "Dépense supprimée" });
    },
    onError: (err) => toast({ title: "Échec", description: err.response?.data?.message || "Erreur", variant: "destructive" }),
  })

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setEditData({
      amount: String(exp.amount),
      category: exp.category || 'purchases',
      description: exp.description || '',
      agent_name: exp.agent_name || '',
      beneficiary: exp.beneficiary || '',
      notes: exp.notes || '',
    });
  }

  const sendReportMut = useMutation({
    mutationFn: () => {
        const email = config?.report_email || config?.email;
        if (!email) throw new Error("Email non configuré");
        
        if (activeTab === 'current' && data?.session?.status !== 'closed') {
            if (amountToBank === '' || remainingAmount === '') {
                throw new Error("Veuillez saisir le 'Montant remis au banquier' et le 'Fond de roulement' (même si c'est 0) dans la section Clôturer la session, avant d'envoyer le rapport.");
            }
        }
        
        const payload = { 
            email, 
            amount_to_bank: amountToBank !== '' ? Number(amountToBank) : undefined,
            remaining_amount: remainingAmount !== '' ? Number(remainingAmount) : undefined
        };
        
        return apiClient.post(`/cash-sessions/${data.session.id}/send-report`, payload);
    },
    onSuccess: () => toast({ title: "Rapport envoyé" }),
    onError: (err) => toast({ title: "Échec d'envoi", description: err.message, variant: "destructive" })
  })

  const handlePrintExpense = (exp) => {
    // On récupère le HTML de la dépense depuis l'API et on l'envoie à l'imprimante 'reports'
    apiClient.get(`/expenses/${exp.id}/receipt?format=html`).then(res => {
        const html = typeof res.data === 'string' ? res.data : res.data.html;
        printToLocalDevice(html, 'reports', config || {});
        toast({ title: "Impression lancée" });
    }).catch(err => {
        console.error("Erreur impression dépense:", err);
        window.open(`${import.meta.env.VITE_API_URL}/expenses/${exp.id}/receipt`, '_blank');
    });
  }

  const handlePrintReport = (sessionId) => {
    // Impression du rapport de clôture
    apiClient.get(`/cash-sessions/${sessionId}/report-html`).then(res => {
        const html = typeof res.data === 'string' ? res.data : res.data.html;
        printToLocalDevice(html, 'reports', config || {});
        toast({ title: "Rapport envoyé à l'imprimante" });
    }).catch(err => {
        console.error("Erreur impression rapport:", err);
        window.open(`${import.meta.env.VITE_API_URL}/cash-sessions/${sessionId}/report`, '_blank');
    });
  }

  if (isLoading) return <div className="p-8 text-center text-xs font-bold text-white/20 uppercase">Chargement...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-4 animate-in fade-in duration-500">
        
        {/* Navigation Tabs Multi-colonnes */}
        <div className="flex bg-card p-1 rounded-xl border border-border w-fit shadow-2xl overflow-x-auto max-w-full no-scrollbar">
            {[
                { id: 'current', label: 'Caisse Actuelle', icon: Wallet },
                { id: 'expenses', label: 'Dépenses', icon: Receipt },
                { id: 'history', label: 'Historique', icon: History }
            ].map(t => (
                <button 
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                        "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                        activeTab === t.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <t.icon size={13} />
                    {t.label}
                </button>
            ))}
        </div>

        {/* Barre de Statut Session (Toujours visible si ouverte) */}
        {data?.session && (
            <Card className="bg-primary text-primary-foreground border-none rounded-2xl shadow-xl">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-primary-foreground" />
                        <div>
                            <p className="text-[10px] font-black uppercase">Caisse Ouverte</p>
                            <p className="text-[9px] text-primary-foreground/80 uppercase">Par {data.session.user?.first_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => sendReportMut.mutate()} disabled={sendReportMut.isPending} variant="ghost" className="h-8 bg-primary-foreground/20 hover:bg-primary-foreground/40 text-primary-foreground hover:text-primary-foreground text-[9px] font-black uppercase">
                            {sendReportMut.isPending ? "Envoi..." : "Envoyer Rapport"}
                        </Button>
                        <Button onClick={() => window.open(`${import.meta.env.VITE_API_URL}/cash-sessions/${data.session.id}/report`, '_blank')} variant="ghost" className="h-8 bg-primary-foreground/20 hover:bg-primary-foreground/40 text-primary-foreground hover:text-primary-foreground text-[9px] font-black uppercase">
                            <Printer size={12} className="mr-1" /> Voir Rapport (PDF)
                        </Button>
                        <Button onClick={() => handlePrintReport(data.session.id)} variant="ghost" className="h-8 bg-black hover:bg-black/80 text-white hover:text-white text-[9px] font-black uppercase border border-white/20">
                            <Printer size={12} className="mr-1" /> Imprimer par Câble
                        </Button>
                        <Button 
                            onClick={() => showFinancials ? setShowFinancials(false) : setIsAdminPinModalOpen(true)} 
                            variant="ghost" 
                            className={cn(
                                "h-8 px-3 text-[9px] font-black uppercase border border-white/20",
                                showFinancials ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                            )}
                        >
                            {showFinancials ? <EyeOff size={12} className="mr-1" /> : <Eye size={12} className="mr-1" />}
                            {showFinancials ? "Masquer FCFA" : "Afficher FCFA"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        {activeTab === 'current' && (
            <>
                {!data?.session ? (
                    <div className="max-w-md mx-auto pt-10">
                        <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-xl text-foreground">
                            <div className="p-8 text-center bg-muted/40">
                                <Unlock size={24} className="text-primary mx-auto mb-3" />
                                <h1 className="text-sm font-black uppercase">Ouvrir la Caisse</h1>
                            </div>
                            <CardContent className="p-8 space-y-4">
                                <Input 
                                    type="number" value={openingAmount}
                                    onChange={e => setOpeningAmount(e.target.value)}
                                    className="h-14 bg-muted border-border text-foreground text-2xl font-black text-center rounded-xl"
                                />
                                <Button onClick={() => openMut.mutate(Number(openingAmount))} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase text-[10px]">Démarrer la Session</Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">

                            <Card className="bg-card border-border rounded-2xl text-foreground">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Solde de Caisse</span>
                                        <Button onClick={() => setIsExpenseOpen(true)} className="h-7 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[9px] font-black uppercase rounded-lg">Nouvelle Dépense</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-muted rounded-xl border border-border">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Ventes (Vécues)</p>
                                            <p className="font-black text-sm text-emerald-500 mb-2">
                                                {showFinancials ? formatAmount(Number(data.session.total_sales) || 0) : '******'}
                                            </p>
                                            
                                            {data.payments_by_method && (
                                                <div className="space-y-1.5 border-t border-border/30 pt-2 mt-2">
                                                    {Object.entries(data.payments_by_method).map(([method, amount]) => {
                                                        if (method === 'grand_total' || method === 'gozem_orders_total' || method === 'cake_orders_total' || amount === 0) return null;
                                                        const label = PAYMENT_METHODS.find(p => p.value === method)?.label || method;
                                                        const isCash = method === 'cash';
                                                        return (
                                                            <div key={method} className="flex justify-between items-center text-[10px] sm:text-[11px]">
                                                                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                                                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                                    {label}
                                                                </span>
                                                                <span className="font-bold text-foreground">
                                                                    {(isCash || method === 'cash') && !showFinancials ? '******' : formatAmount(amount)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}

                                                    {Number(data.gozem_orders_total) > 0 && (
                                                        <div className="flex justify-between items-center text-[10px] sm:text-[11px] pt-1.5 border-t border-dashed border-primary/20 mt-1.5">
                                                            <span className="text-primary font-black uppercase tracking-tighter">Dont Gozem</span>
                                                            <span className="font-black text-primary">{formatAmount(data.gozem_orders_total)}</span>
                                                        </div>
                                                    )}

                                                    {Number(data.cake_orders_total) > 0 && (
                                                        <div className="flex justify-between items-center text-[10px] sm:text-[11px] pt-1.5 border-t border-dashed border-primary/20 mt-1.5">
                                                            <span className="text-primary font-black uppercase tracking-tighter">Dont Gâteau</span>
                                                            <span className="font-black text-primary">{formatAmount(data.cake_orders_total)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-muted rounded-xl border border-border">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Dépenses</p>
                                            <p className="font-black text-sm text-destructive">-{formatAmount(Number(data.session.total_expenses) || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                                        <p className="text-[10px] font-black text-primary uppercase mb-1">Total Attendu en Caisse</p>
                                        <p className="text-2xl font-black text-primary tracking-tighter">
                                            {showFinancials ? formatAmount(Number(data.session.expected_amount) || 0) : '******'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-card border-border rounded-2xl text-foreground">
                            <CardContent className="p-5 space-y-5">
                                <h3 className="text-xs font-black uppercase text-center">Clôturer la Session</h3>
                                
                                <div className="p-3 bg-muted rounded-xl border border-border text-center">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Argent au début (Ouverture)</p>
                                    <p className="font-black text-sm text-foreground">{formatAmount(Number(data.session.opening_amount) || 0)}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] uppercase text-muted-foreground font-black block text-center">Montant remis au banquier / comptable</Label>
                                        <Input 
                                            type="number" value={amountToBank} placeholder="0"
                                            onChange={e => setAmountToBank(e.target.value)}
                                            className="h-12 bg-muted border-border text-foreground text-2xl font-black text-center rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[9px] uppercase text-muted-foreground font-black block text-center">Montant resté en caisse (Fond de roulement)</Label>
                                        <Input 
                                            type="number" value={remainingAmount} placeholder="0"
                                            onChange={e => setRemainingAmount(e.target.value)}
                                            className="h-12 bg-muted border-border text-foreground text-2xl font-black text-center rounded-xl"
                                        />
                                    </div>

                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-center">
                                        <p className="text-[10px] font-black text-primary uppercase mb-1">Total réel compté</p>
                                        <p className="text-xl font-black text-primary">
                                            {formatAmount((Number(amountToBank) || 0) + (Number(remainingAmount) || 0))}
                                        </p>
                                    </div>
                                </div>

                                <Textarea 
                                    value={closingNotes} onChange={e => setClosingNotes(e.target.value)}
                                    placeholder="Notes ou explications..."
                                    className="bg-muted border-border text-foreground rounded-xl text-[11px] min-h-[80px]"
                                />
                                <Button 
                                    onClick={() => closeMut.mutate({ 
                                        amount_to_bank: Number(amountToBank), 
                                        remaining_amount: Number(remainingAmount), 
                                        notes: closingNotes 
                                    })}
                                    className="w-full h-12 bg-primary text-primary-foreground font-black uppercase text-[10px] rounded-xl hover:bg-primary/90 transition-all shadow-xl"
                                >
                                    Valider et Fermer
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </>
        )}

        {activeTab === 'expenses' && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-4">
                <Card className="bg-card border-border rounded-xl overflow-hidden text-foreground">
                    {/* Barre de filtres */}
                    <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Journal des Sorties</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Filtre date */}
                            <div className="relative flex items-center">
                                <Calendar size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
                                <input
                                    type="date"
                                    value={expenseDateFilter}
                                    onChange={e => setExpenseDateFilter(e.target.value)}
                                    className="h-8 pl-9 pr-3 bg-muted border border-border rounded-lg text-[10px] font-black text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                    title="Filtrer par date"
                                />
                                {expenseDateFilter && (
                                    <button
                                        onClick={() => setExpenseDateFilter('')}
                                        className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Effacer le filtre"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                            {/* Compteur filtré */}
                            {expenseDateFilter && (
                                <span className="text-[9px] font-black uppercase text-destructive bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-lg">
                                    {filteredExpenses.length} dépense{filteredExpenses.length !== 1 ? 's' : ''} · -{formatAmount(filteredTotal)}
                                </span>
                            )}
                            <Button 
                                onClick={() => setIsExpenseOpen(true)} 
                                disabled={!data?.session}
                                size="sm" 
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-[9px] font-black uppercase"
                            >
                                {data?.session ? "Ajouter" : "Caisse fermée"}
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-auto max-h-[500px] custom-scrollbar">
                        <table className="w-full text-[11px]">
                            <thead className="bg-muted/90 text-muted-foreground uppercase font-black sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-4 py-3 text-left">Heure</th>
                                    <th className="px-4 py-3 text-left">Motif / Bénéficiaire</th>
                                    <th className="px-4 py-3 text-left text-center">Agent</th>
                                    <th className="px-4 py-3 text-right">Montant</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredExpenses.length === 0 ? (
                                    <tr><td colSpan="5" className="py-10 text-center text-muted-foreground font-black uppercase">
                                        {expenseDateFilter ? `Aucune dépense le ${format(new Date(expenseDateFilter + 'T12:00:00'), 'dd MMMM yyyy', { locale: fr })}` : 'Aucune dépense'}
                                    </td></tr>
                                ) : filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-muted transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-bold whitespace-nowrap">{format(new Date(exp.created_at), 'dd/MM HH:mm')}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-foreground font-black uppercase truncate max-w-[200px]">{exp.description}</p>
                                            <p className="text-[9px] text-primary font-bold uppercase italic">Chez: {exp.beneficiary || 'Non spécifié'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-muted px-2 py-0.5 rounded text-[9px] font-black text-muted-foreground uppercase">{exp.agent_name || exp.user?.first_name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-destructive italic">-{formatAmount(exp.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 px-3 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-primary/20 font-black uppercase text-[9px] rounded-lg gap-1" 
                                                    title="Imprimer Reçu A4" 
                                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}/expenses/${exp.id}/receipt`, '_blank')}
                                                >
                                                    <Printer size={12} />
                                                    A4
                                                </Button>
                                                {canManageExpenses && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border-blue-500/20 rounded-lg" 
                                                            title="Modifier" 
                                                            onClick={() => openEditModal(exp)}
                                                        >
                                                            <Pencil size={12} />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            className="h-8 w-8 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border-destructive/20 rounded-lg" 
                                                            title="Supprimer" 
                                                            onClick={() => setDeletingExpense(exp)}
                                                        >
                                                            <Trash2 size={12} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Total pied de tableau */}
                        {filteredExpenses.length > 0 && (
                            <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">
                                    {expenseDateFilter
                                        ? `Total du ${format(new Date(expenseDateFilter + 'T12:00:00'), 'dd MMM yyyy', { locale: fr })}`
                                        : `Total (${filteredExpenses.length} dépenses)`
                                    }
                                </span>
                                <span className="text-sm font-black text-destructive italic">-{formatAmount(filteredTotal)}</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-500">
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl text-foreground">
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-[11px]">
                            <thead className="bg-muted/40 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-left">Date & Session</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-left">Caissier</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-right">Ouverture</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-right">Ventes Net</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-right">Dépenses</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-right">Versé / Bank</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-right">Fond Restant</th>
                                    <th className="px-5 py-3 font-black text-muted-foreground uppercase text-right">Écart Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {history.map(session => {
                                    const sales = getHistorySales(session);
                                    const diff = Number(session.difference || (Number(session.closing_amount || 0) - Number(session.expected_amount || 0)));
                                    const isClosed = !!(session.status === 'closed' || session.closed_at);
                                    return (
                                        <tr key={session.id} className="hover:bg-muted">
                                            <td className="px-5 py-3">
                                                <p className="font-black text-foreground">{format(new Date(session.opened_at), 'dd MMM yyyy', { locale: fr })}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-black">S#{session.id} • {format(new Date(session.opened_at), 'HH:mm')}</p>
                                            </td>
                                            <td className="px-5 py-3 uppercase font-black text-muted-foreground">{session.user?.first_name}</td>
                                            <td className="px-5 py-3 text-right font-black text-muted-foreground/60">{formatAmount(Number(session.opening_amount) || 0)}</td>
                                            <td className="px-5 py-3 text-right font-black text-emerald-500">
                                                {showFinancials ? formatAmount(sales) : '******'}
                                            </td>
                                            <td className="px-5 py-3 text-right font-black text-destructive">-{formatAmount(Number(session.total_expenses) || 0)}</td>
                                            <td className="px-5 py-3 text-right font-black text-primary">{isClosed ? formatAmount(Number(session.amount_to_bank) || 0) : '-'}</td>
                                            <td className="px-5 py-3 text-right font-black text-muted-foreground">{isClosed ? formatAmount(Number(session.remaining_amount) || 0) : '-'}</td>
                                            <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                                                {isClosed ? (
                                                    <>
                                                        <span className={cn("font-black italic px-2 py-1 rounded text-[10px]", diff >= 0 ? "text-emerald-500 bg-emerald-500/5" : "text-destructive bg-destructive/5")}>
                                                            {diff > 0 && '+'} {formatAmount(diff)}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary hover:text-primary-foreground" title="Voir PDF" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/cash-sessions/${session.id}/report`, '_blank')}>
                                                            <Receipt size={12} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-black text-white hover:bg-black/80 ml-1" title="Imprimer par Câble" onClick={() => handlePrintReport(session.id)}>
                                                            <Printer size={12} />
                                                        </Button>
                                                    </>
                                                ) : <span className="text-primary font-black uppercase text-[8px] border border-primary/20 px-2 py-1 rounded">Actif</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* Expense Modal (Enrichi) */}
        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
            <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-muted/40 border-b border-border">
                <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <ArrowUpDown size={18} className="text-primary" />
                    Nouvelle Sortie de Caisse
                </DialogTitle>
            </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Montant de la dépense (FCFA)</Label>
                        <Input 
                            type="number" placeholder="0" value={expenseData.amount}
                            onChange={e => setExpenseData({...expenseData, amount: e.target.value})}
                            className="h-16 bg-muted border-border text-foreground rounded-2xl text-3xl font-black text-center focus:ring-primary shadow-inner" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Agent Bénéficiaire</Label>
                            <Input 
                                placeholder="Nom de l'agent" value={expenseData.agent_name}
                                onChange={e => setExpenseData({...expenseData, agent_name: e.target.value})}
                                className="h-12 bg-muted border-border text-foreground rounded-xl text-xs font-black uppercase" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Lieu / Fournisseur</Label>
                            <Input 
                                placeholder="Chez qui ?" value={expenseData.beneficiary}
                                onChange={e => setExpenseData({...expenseData, beneficiary: e.target.value})}
                                className="h-12 bg-muted border-border text-foreground rounded-xl text-xs font-black uppercase" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Catégorie & Motif</Label>
                        <div className="flex gap-2">
                            <select 
                                value={expenseData.category}
                                onChange={e => setExpenseData({...expenseData, category: e.target.value})}
                                className="w-1/3 h-12 rounded-xl bg-muted border border-border px-3 text-[10px] font-black text-foreground uppercase outline-none appearance-none cursor-pointer"
                            >
                                <option value="purchases" className="text-foreground bg-card">Achats</option>
                                <option value="staff" className="text-foreground bg-card">Avances</option>
                                <option value="utilities" className="text-foreground bg-card">Factures</option>
                                <option value="other" className="text-foreground bg-card">Autre</option>
                            </select>
                            <Input 
                                value={expenseData.notes}
                                onChange={e => setExpenseData({...expenseData, notes: e.target.value})}
                                placeholder="Pourquoi cette dépense ?"
                                className="flex-1 h-12 bg-muted border-border text-foreground rounded-xl text-xs font-black uppercase" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1 bg-muted border border-border text-[10px] text-foreground hover:bg-muted/80 font-black uppercase h-12 rounded-xl" onClick={() => setIsExpenseOpen(false)}>Annuler</Button>
                        <Button className="flex-1 bg-primary text-[10px] font-black uppercase h-12 rounded-xl text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => expenseMut.mutate(expenseData)}>Enregistrer la Sortie</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Modal Modification Dépense (Admin/Manager/Caissier) */}
        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
            <DialogContent className="max-w-md bg-card border-border text-foreground rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-blue-500/10 border-b border-border">
                <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Pencil size={18} className="text-blue-500" />
                    Modifier la Dépense
                </DialogTitle>
            </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Montant (FCFA)</Label>
                        <Input 
                            type="number" placeholder="0" value={editData.amount}
                            onChange={e => setEditData({...editData, amount: e.target.value})}
                            className="h-16 bg-muted border-border text-foreground rounded-2xl text-3xl font-black text-center focus:ring-blue-500 shadow-inner" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Agent</Label>
                            <Input 
                                placeholder="Nom de l'agent" value={editData.agent_name}
                                onChange={e => setEditData({...editData, agent_name: e.target.value})}
                                className="h-12 bg-muted border-border text-foreground rounded-xl text-xs font-black uppercase" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Fournisseur</Label>
                            <Input 
                                placeholder="Chez qui ?" value={editData.beneficiary}
                                onChange={e => setEditData({...editData, beneficiary: e.target.value})}
                                className="h-12 bg-muted border-border text-foreground rounded-xl text-xs font-black uppercase" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Catégorie & Motif</Label>
                        <div className="flex gap-2">
                            <select 
                                value={editData.category}
                                onChange={e => setEditData({...editData, category: e.target.value})}
                                className="w-1/3 h-12 rounded-xl bg-muted border border-border px-3 text-[10px] font-black text-foreground uppercase outline-none appearance-none cursor-pointer"
                            >
                                <option value="purchases">Achats</option>
                                <option value="staff">Avances</option>
                                <option value="utilities">Factures</option>
                                <option value="other">Autre</option>
                            </select>
                            <Input 
                                value={editData.description}
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                placeholder="Description"
                                className="flex-1 h-12 bg-muted border-border text-foreground rounded-xl text-xs font-black uppercase" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1 bg-muted border border-border text-[10px] text-foreground hover:bg-muted/80 font-black uppercase h-12 rounded-xl" onClick={() => setEditingExpense(null)}>Annuler</Button>
                        <Button 
                            className="flex-1 bg-blue-500 text-[10px] font-black uppercase h-12 rounded-xl text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20" 
                            disabled={updateExpenseMut.isPending}
                            onClick={() => updateExpenseMut.mutate({ id: editingExpense.id, ...editData })}
                        >
                            {updateExpenseMut.isPending ? 'Modification...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Modal Confirmation Suppression (Admin/Manager/Caissier) */}
        <Dialog open={!!deletingExpense} onOpenChange={(open) => { if (!open) { setDeletingExpense(null); setDeleteReason(''); }}}>
            <DialogContent className="max-w-sm bg-card border-border text-foreground rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-destructive/10 border-b border-border">
                <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-destructive">
                    <AlertTriangle size={18} />
                    Supprimer la Dépense
                </DialogTitle>
            </DialogHeader>
                <div className="p-8 space-y-6">
                    {deletingExpense && (
                        <div className="bg-muted rounded-2xl p-4 border border-border space-y-2">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Dépense concernée</p>
                            <p className="text-sm font-black text-foreground">{deletingExpense.description}</p>
                            <p className="text-lg font-black text-destructive italic">-{formatAmount(deletingExpense.amount)}</p>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Motif de suppression (obligatoire)</Label>
                        <Textarea 
                            value={deleteReason}
                            onChange={e => setDeleteReason(e.target.value)}
                            placeholder="Pourquoi supprimer cette dépense ?"
                            className="bg-muted border-border text-foreground rounded-xl text-[11px] min-h-[80px]"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1 bg-muted border border-border text-[10px] text-foreground hover:bg-muted/80 font-black uppercase h-12 rounded-xl" onClick={() => { setDeletingExpense(null); setDeleteReason(''); }}>Annuler</Button>
                        <Button 
                            className="flex-1 bg-destructive text-[10px] font-black uppercase h-12 rounded-xl text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20" 
                            disabled={deleteReason.length < 5 || deleteExpenseMut.isPending}
                            onClick={() => deleteExpenseMut.mutate({ id: deletingExpense.id, reason: deleteReason })}
                        >
                            {deleteExpenseMut.isPending ? 'Suppression...' : 'Confirmer la Suppression'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* PIN Modal for Admin Access */}
        <Dialog open={isAdminPinModalOpen} onOpenChange={setIsAdminPinModalOpen}>
            <DialogContent className="max-w-[20rem] bg-card border-border text-foreground rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border space-y-4">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
                        <Lock size={28} className="text-primary-foreground" />
                    </div>
                    <DialogTitle className="text-center text-xl font-black italic uppercase tracking-tighter leading-none text-foreground">Admin requis</DialogTitle>
                    <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">Saisissez le PIN Admin pour afficher les montants</p>
                </DialogHeader>
                <div className="p-10 pt-4 space-y-8">
                    <Input
                        type="password"
                        value={adminPin}
                        onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="******"
                        className="text-center text-4xl h-20 bg-muted/50 border-border font-black text-foreground tracking-[0.5em] rounded-2xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                        maxLength={6}
                        inputMode="numeric"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="ghost" className="h-14 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl" onClick={() => setIsAdminPinModalOpen(false)}>Annuler</Button>
                        <Button 
                            className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20" 
                            onClick={handleValidateAdminPin} 
                            disabled={adminPin.length < 4 || isValidatingPin}
                        >
                            {isValidatingPin ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" /> : "Valider"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}
