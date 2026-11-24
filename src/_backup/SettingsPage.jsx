import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import apiClient from '@/api/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Save, Store, Bell, Shield, Printer, Database, Download, AlertTriangle, Trash2, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Restaurant info
  const { data: restaurant } = useQuery({
    queryKey: ['restaurant-info'],
    queryFn: () => apiClient.get('/settings').then(r => r.data),
  })

  // Configuration (settings column)
  const { data: config } = useQuery({
    queryKey: ['settings-config'],
    queryFn: () => apiClient.get('/settings/config').then(r => r.data),
  })

  const saveRestaurantMut = useMutation({
    mutationFn: (data) => apiClient.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-info'] })
      toast({ description: "Informations du restaurant mises à jour" })
    },
    onError: () => toast({ description: "Échec de la mise à jour", variant: "destructive" })
  })

  const saveConfigMut = useMutation({
    mutationFn: (data) => apiClient.put('/settings/config', { settings: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-config'] })
      toast({ description: "Paramètres système mis à jour" })
    },
    onError: () => toast({ description: "Échec de la mise à jour", variant: "destructive" })
  })

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl px-2 lg:px-4">
      <PageHeader title="Paramètres" subtitle="Configuration de votre établissement" />
      
      <Tabs defaultValue="general">
        <TabsList className="bg-muted border-border p-1">
          <TabsTrigger value="general" className="gap-1.5"><Store size={14} /> Général</TabsTrigger>
           <TabsTrigger value="receipt" className="gap-1.5"><Printer size={14} /> Ticket</TabsTrigger>
          <TabsTrigger value="vat" className="gap-1.5"><FileText size={14} /> Rapport TVA</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5"><Bell size={14} /> Alertes</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield size={14} /> Sécurité</TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5"><Database size={14} /> Données</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralSettings 
             restaurant={restaurant} 
             onSave={d => saveRestaurantMut.mutate(d)} 
             isSaving={saveRestaurantMut.isPending} 
          />
        </TabsContent>

        <TabsContent value="receipt" className="mt-4">
          <ReceiptSettings 
             config={config} 
             onSave={d => saveConfigMut.mutate(d)} 
             isSaving={saveConfigMut.isPending} 
          />
        </TabsContent>

        <TabsContent value="vat" className="mt-4">
          <VATReportTab />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <AlertSettings 
             config={config} 
             onSave={d => saveConfigMut.mutate(d)} 
             isSaving={saveConfigMut.isPending} 
          />
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="export" className="mt-4">
          <DataExportSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GeneralSettings({ restaurant, onSave, isSaving }) {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { name: '', phone: '', address: '', email: '', vat_number: '', currency: 'XOF', receipt_subtitle: '' },
  })

  useEffect(() => {
    if (restaurant) reset({
        name: restaurant.name,
        phone: restaurant.phone,
        address: restaurant.address,
        email: restaurant.email,
        vat_number: restaurant.vat_number,
        currency: restaurant.currency,
        receipt_subtitle: restaurant.settings?.receipt_subtitle || ''
    })
  }, [restaurant, reset])

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader><CardTitle className="text-foreground text-sm">Informations de base</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div><Label className="text-muted-foreground">Nom du restaurant</Label><Input {...register('name')} className="mt-1 bg-muted border-border text-foreground" /></div>
             <div><Label className="text-muted-foreground">Sous-titre / Slogan (Sur les tickets)</Label><Input {...register('receipt_subtitle')} placeholder="Ex: Restaurant - Bar - Glacier" className="mt-1 bg-muted border-border text-foreground" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-muted-foreground">Téléphone</Label><Input {...register('phone')} className="mt-1 bg-muted border-border text-foreground" /></div>
            <div><Label className="text-muted-foreground">Email</Label><Input {...register('email')} className="mt-1 bg-muted border-border text-foreground" /></div>
          </div>
          <div><Label className="text-muted-foreground">Adresse</Label><Input {...register('address')} className="mt-1 bg-muted border-border text-foreground" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-muted-foreground">N° TVA / Registre</Label><Input {...register('vat_number')} className="mt-1 bg-muted border-border text-foreground" /></div>
            <div>
              <Label className="text-muted-foreground">Devise</Label>
              <Controller name="currency" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="flex justify-end pt-2"><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold px-8" disabled={isSaving}><Save size={15} /> Enregistrer</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

function ReceiptSettings({ config, onSave, isSaving }) {
    const { register, handleSubmit, control, reset } = useForm({
       defaultValues: { receipt_footer: '', receipt_width: '80mm', auto_print_receipt: true, default_vat_rate: 18, gozem_discount_rate: 12, report_email: '', kitchen_printer_ip: '', bar_printer_ip: '', pizza_printer_ip: '', cakes_printer_ip: '' }
    })

    useEffect(() => { if (config) reset(config) }, [config, reset])

    return (
        <Card className="border-border bg-card shadow-sm">
            <CardHeader><CardTitle className="text-sm text-foreground">Configuration du Ticket & Impression Réseau</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Taux TVA (%)</Label>
                            <Input {...register('default_vat_rate', { valueAsNumber: true })} type="number" step="0.5" min="0" className="mt-1 bg-muted border-border text-foreground font-black" />
                        </div>
                        <div className="bg-primary/5 p-1 rounded-lg border border-primary/20">
                            <Label className="text-primary text-[10px] uppercase font-bold tracking-wider pl-1">Réduction Gozem (%)</Label>
                            <Input {...register('gozem_discount_rate', { valueAsNumber: true })} type="number" step="0.1" min="0" max="100" className="mt-0.5 bg-background border-primary/20 text-foreground font-black" />
                        </div>
                        <div className="lg:col-span-1">
                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Email Rapports</Label>
                            <Input {...register('report_email')} type="email" placeholder="boss@example.com" className="mt-1 bg-muted border-border text-foreground" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Largeur du papier</Label>
                            <Controller name="receipt_width" control={control} render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="mt-1 bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        <SelectItem value="80mm">80 mm (Standard)</SelectItem>
                                        <SelectItem value="58mm">58 mm (Compact)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Message de pied de page</Label>
                            <Input {...register('receipt_footer')} className="mt-1 bg-muted border-border text-foreground" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-4">
                        <Label className="text-foreground tracking-wide font-semibold text-xs uppercase">Routage des Imprimantes (IP pour Android / Nom pour QZ Tray)</Label>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                                <div>
                                    <Label className="text-muted-foreground text-[10px] uppercase font-bold">Cuisine</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input {...register('kitchen_printer_ip')} placeholder="IP (ex: 192.168.1.100)" className="bg-muted border-border text-foreground text-xs" />
                                        <Input {...register('kitchen_printer_name')} placeholder="Nom (QZ Tray)" className="bg-muted border-border text-foreground text-xs" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-[10px] uppercase font-bold">Bar</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input {...register('bar_printer_ip')} placeholder="IP (ex: 192.168.1.101)" className="bg-muted border-border text-foreground text-xs" />
                                        <Input {...register('bar_printer_name')} placeholder="Nom (QZ Tray)" className="bg-muted border-border text-foreground text-xs" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-3 rounded-lg">
                                    <Label className="text-muted-foreground text-[10px] uppercase font-bold">Pizza</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input {...register('pizza_printer_ip')} placeholder="IP (ex: 192.168.1.102)" className="bg-muted border-border text-foreground text-xs" />
                                        <Input {...register('pizza_printer_name')} placeholder="Nom (QZ Tray)" className="bg-muted border-border text-foreground text-xs" />
                                    </div>
                                </div>
                                <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                                    <Label className="text-orange-600 text-[10px] uppercase font-bold">Pâtisserie (Gâteaux)</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input {...register('cakes_printer_ip')} placeholder="IP (ex: 192.168.1.105)" className="bg-muted border-border text-foreground text-xs" />
                                        <Input {...register('cakes_printer_name')} placeholder="Nom (QZ Tray)" className="bg-muted border-border text-foreground text-xs" />
                                    </div>
                                </div>
                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                                    <Label className="text-primary text-[10px] uppercase font-bold">Ticket de Caisse (Client)</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input {...register('receipt_printer_ip')} placeholder="IP de l'imprimante reçu" className="bg-muted border-primary/20 border text-foreground text-xs" />
                                        <Input {...register('receipt_printer_name')} placeholder="Nom (QZ Tray)" className="bg-muted border-primary/20 border text-foreground text-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                       <Label className="text-muted-foreground">Impression auto</Label>
                       <Controller name="auto_print_receipt" control={control} render={({ field }) => (
                           <Switch checked={field.value} onCheckedChange={field.onChange} />
                       )} />
                    </div>
                    <div className="flex justify-end pt-2"><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold px-8" disabled={isSaving}><Save size={15} /> Enregistrer</Button></div>
                </form>
            </CardContent>
        </Card>
    )
}

function AlertSettings({ config, onSave, isSaving }) {
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { kitchen_alert_sound: true, order_timeout_alert: 15, low_stock_alerts: true },
  })

  useEffect(() => { if (config) reset(config) }, [config, reset])

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
        <div><Label className="text-foreground">Sonnerie cuisine</Label><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Alerte audio pour nouvelles commandes</p></div>
        <Controller name="kitchen_alert_sound" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
      </div>
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
        <div><Label className="text-foreground">Achat & Stock</Label><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Alerte stock faible ou critique</p></div>
        <Controller name="low_stock_alerts" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
      </div>
      <div className="p-4 bg-card border border-border rounded-xl space-y-2 shadow-sm">
         <Label className="text-foreground">Délai alerte attente (minutes)</Label>
         <Input {...register('order_timeout_alert')} type="number" min={5} max={60} className="w-24 bg-muted border-border text-foreground h-12 text-center text-lg font-black" />
         <p className="text-[10px] text-muted-foreground font-medium">Alerte visuelle si une commande dépasse ce délai en cuisine.</p>
      </div>
      <div className="flex justify-end pt-2"><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold px-8" disabled={isSaving}><Save size={15} /> Enregistrer</Button></div>
    </form>
  )
}

function SecuritySettings() {
  const { register, handleSubmit, reset } = useForm()
  const { toast } = useToast()
  const mut = useMutation({ 
    mutationFn: (d) => apiClient.put('/auth/change-password', d),
    onSuccess: () => {
        toast({ description: "Mot de passe modifié" })
        reset()
    },
    onError: (err) => toast({ description: err.response?.data?.message || "Échec de la modification", variant: "destructive" })
  })
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader><CardTitle className="text-sm text-foreground">Changer mon mot de passe</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
          <div><Label className="text-muted-foreground">Mot de passe actuel</Label><Input {...register('current_password', { required: true })} type="password" className="mt-1 bg-muted border-border text-foreground" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><Label className="text-muted-foreground">Nouveau</Label><Input {...register('password', { required: true })} type="password" className="mt-1 bg-muted border-border text-foreground" /></div>
             <div><Label className="text-muted-foreground">Confirmation</Label><Input {...register('password_confirmation', { required: true })} type="password" className="mt-1 bg-muted border-border text-foreground" /></div>
          </div>
          <div className="flex justify-end pt-2"><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8" disabled={mut.isPending}>Mettre à jour</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

function DataExportSection() {
  const { register, handleSubmit, getValues } = useForm({
    defaultValues: {
      from: new Date().toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  })
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isPurging, setIsPurging] = useState(false)
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false)
  const [purgeConfirmText, setPurgeConfirmText] = useState('')

  const onSubmit = async (data) => {
    setIsExporting(true)
    try {
      const response = await apiClient.get('/reports/export-all', { 
        params: data, 
        responseType: 'blob' 
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.ms-excel' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `export_omega_${data.from}_${data.to}.xls`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({ description: "Exportation terminée avec succès" })
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result)
            toast.error(errorData.debug || errorData.message || "Erreur serveur lors de l'exportation")
          } catch (e) {
            toast.error("Erreur lors de l'exportation des données")
          }
        }
        reader.readAsText(err.response.data)
      } else {
        toast.error("Erreur lors de l'exportation des données")
      }
      console.error(err)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePurge = async () => {
    const dates = getValues()
    setIsPurging(true)
    try {
      await apiClient.post('/reports/purge-data', { 
        from: dates.from, 
        to: dates.to, 
        confirm_text: 'EFFACER' 
      })
      toast({ description: "Les données ont été effacées définitivement" })
      setShowPurgeConfirm(false)
      setPurgeConfirmText('')
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erreur lors de la purge des données"
      toast({ 
        description: errorMsg, 
        variant: "destructive" 
      })
    } finally {
      setIsPurging(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Database size={16} className="text-primary" />
            Gestion des données & Rapports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
             <p className="text-xs text-muted-foreground leading-relaxed">
               Générez un rapport Excel complet (Rapport, Analyse, Commandes, Paiements, Gâteaux, Ardoises, Logs) pour la période de votre choix.
             </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Date de début</Label>
                 <Input {...register('from')} type="date" className="mt-1 bg-muted border-border text-foreground h-11" />
              </div>
              <div>
                 <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Date de fin</Label>
                 <Input {...register('to')} type="date" className="mt-1 bg-muted border-border text-foreground h-11" />
              </div>
            </div>
            <Button type="submit" disabled={isExporting} className="w-full h-11 gap-2 font-bold text-sm">
              {isExporting ? "Chargement..." : <><Download size={16} /> Télécharger le rapport complet (.xls)</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
        <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-tighter">
            <AlertTriangle size={14} />
            Zone de Danger - Purge des données
          </div>
        </div>
        <CardContent className="pt-4">
          <p className="text-[11px] text-muted-foreground mb-4">
            Cette action effacera <strong>DÉFINITIVEMENT</strong> toutes les données (commandes, rapports, gâteaux, logs) pour l'intervalle de dates sélectionné ci-dessus.
          </p>
          
          {!showPurgeConfirm ? (
            <Button 
              variant="destructive" 
              className="w-full h-10 text-xs font-bold gap-2"
              onClick={() => setShowPurgeConfirm(true)}
            >
              <Trash2 size={14} /> Vider les données de la période
            </Button>
          ) : (
            <div className="space-y-3 p-3 bg-card border border-destructive/30 rounded-lg animate-in fade-in zoom-in duration-200">
               <Label className="text-[10px] uppercase font-black text-destructive">Confirmation requise</Label>
               <p className="text-[10px] text-foreground">Tapez <strong>EFFACER</strong> ci-dessous pour confirmer la destruction :</p>
               <Input 
                 value={purgeConfirmText}
                 onChange={(e) => setPurgeConfirmText(e.target.value)}
                 placeholder="Tapez EFFACER ici"
                 className="h-10 border-destructive/50 focus-visible:ring-destructive bg-muted text-center font-bold"
               />
               <div className="flex gap-2">
                 <Button 
                   variant="outline" 
                   className="flex-1 h-10 text-xs"
                   onClick={() => { setShowPurgeConfirm(false); setPurgeConfirmText(''); }}
                 >
                   Annuler
                 </Button>
                 <Button 
                   variant="destructive" 
                   disabled={purgeConfirmText !== 'EFFACER' || isPurging}
                   className="flex-1 h-10 text-xs font-bold"
                   onClick={handlePurge}
                 >
                   {isPurging ? 'Suppression...' : 'Confirmer la suppression'}
                 </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function VATReportTab() {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      from: new Date().toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    }
  })

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['tax-summary', watch('from'), watch('to')],
    queryFn: () => apiClient.get('/reports/tax-summary', { params: { from: watch('from'), to: watch('to') } }).then(r => r.data),
    enabled: !!watch('from') && !!watch('to')
  })

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm text-foreground flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          Récapitulatif Fiscal (TVA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Consultez le total de vos ventes TTC et la TVA collectée pour une période donnée.
          </p>
        </div>

        <form className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Du</Label>
            <Input {...register('from')} type="date" className="mt-1 bg-muted border-border text-foreground h-11" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Au</Label>
            <Input {...register('to')} type="date" className="mt-1 bg-muted border-border text-foreground h-11" />
          </div>
        </form>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">Chargement des données...</div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center text-center">
               <span className="text-[10px] uppercase font-black text-primary tracking-widest mb-1">Total Ventes (TTC)</span>
               <span className="text-3xl font-black text-foreground">
                 {new Intl.NumberFormat('fr-FR').format(summary.total_revenue)} <small className="text-xs font-bold opacity-50">FCFA</small>
               </span>
               <span className="text-[10px] text-muted-foreground mt-1">{summary.orders_count} commandes payées</span>
            </div>

            <div className="p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10 flex flex-col items-center justify-center text-center">
               <span className="text-[10px] uppercase font-black text-orange-600 tracking-widest mb-1">TVA à reverser</span>
               <span className="text-3xl font-black text-foreground text-orange-600">
                 {new Intl.NumberFormat('fr-FR').format(summary.total_vat)} <small className="text-xs font-bold opacity-50">FCFA</small>
               </span>
               <span className="text-[10px] text-muted-foreground mt-1">Sur la base du taux configuré</span>
            </div>
          </div>
        ) : null}
        
        <div className="flex justify-end">
           <Button variant="outline" className="text-xs gap-2" onClick={() => refetch()}>
             Actualiser les calculs
           </Button>
        </div>
      </CardContent>
    </Card>
  )
}
