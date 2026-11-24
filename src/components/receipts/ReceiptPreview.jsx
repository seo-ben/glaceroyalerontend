import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { receiptsApi } from '@/api/receipts'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePrint } from '@/hooks/usePrint'
import { 
  Printer, 
  Mail, 
  Smartphone, 
  Download, 
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export default function ReceiptPreview({ orderId }) {
  const { toast } = useToast()
  const { printReceipt, downloadReceipt } = usePrint()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [format, setFormat] = useState('receipt') // 'receipt' or 'invoice'

  const { data: html, isLoading, isError } = useQuery({
    queryKey: ['receipt-html', orderId, format],
    queryFn:  () => format === 'invoice' 
      ? receiptsApi.invoiceHtml(orderId).then(r => r.data.html)
      : receiptsApi.html(orderId).then(r => r.data.html),
    enabled:  !!orderId,
  })

  const emailMutation = useMutation({
    mutationFn: (email) => receiptsApi.sendEmail(orderId, { email }),
    onSuccess: () => {
      toast({ description: "Renvoyé par email avec succès" })
      setShowEmailInput(false)
    },
    onError: () => toast({ description: "Échec de l'envoi email", variant: "destructive" })
  })

  const smsMutation = useMutation({
    mutationFn: (phone) => receiptsApi.sendSms(orderId, { phone }),
    onSuccess: () => {
      toast({ description: "Renvoyé par SMS avec succès" })
      setShowPhoneInput(false)
    },
    onError: () => toast({ description: "Échec de l'envoi SMS", variant: "destructive" })
  })

  if (isLoading) return (
    <div className="space-y-4 max-w-[400px] mx-auto">
      <Skeleton className="h-[500px] w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )

  if (isError) return (
    <div className="p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/10">
      <XCircle size={40} className="mx-auto text-red-500 mb-2" />
      <p className="text-red-400 font-bold uppercase text-xs">Erreur de chargement du document</p>
    </div>
  )

  return (
    <div className={cn(
      "space-y-6 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500",
      format === 'invoice' ? "max-w-3xl" : "max-w-[360px]"
    )}>
      {/* Format Toggle + Receipt Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-2 bg-card rounded-2xl border border-border">
        {/* Toggle format */}
        <div className="flex p-1 bg-muted rounded-xl w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFormat('receipt')}
            className={cn(
              "flex-1 h-8 text-[10px] uppercase font-black tracking-widest rounded-lg px-4",
              format === 'receipt' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Petit Ticket
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFormat('invoice')}
            className={cn(
              "flex-1 h-8 text-[10px] uppercase font-black tracking-widest rounded-lg px-4",
              format === 'invoice' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Facture A4
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => printReceipt(orderId, format)}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Imprimer"
          >
            <Printer size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => downloadReceipt(orderId, format)}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Télécharger PDF"
          >
            <Download size={18} />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { setShowEmailInput(!showEmailInput); setShowPhoneInput(false) }}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              showEmailInput ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Mail size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { setShowPhoneInput(!showPhoneInput); setShowEmailInput(false) }}
            className={cn(
              "h-10 w-10 rounded-xl transition-all",
              showPhoneInput ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Smartphone size={18} />
          </Button>
        </div>
      </div>

      {/* Dynamic Input Areas */}
      {(showEmailInput || showPhoneInput) && (
        <div className="animate-in slide-in-from-top-2">
            {showEmailInput && (
                <div className="flex gap-2 p-2 bg-card rounded-2xl border border-border">
                <Input 
                    placeholder="Email du client" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-10 bg-transparent border-none text-foreground focus:ring-0 text-sm"
                />
                <Button 
                    disabled={!email || emailMutation.isPending}
                    onClick={() => emailMutation.mutate(email)}
                    className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest"
                >
                    {emailMutation.isPending ? <RefreshCw className="animate-spin" size={14} /> : 'Envoyer'}
                </Button>
                </div>
            )}

            {showPhoneInput && (
                <div className="flex gap-2 p-2 bg-card rounded-2xl border border-border">
                <Input 
                    placeholder="+221 ..." 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-10 bg-transparent border-none text-foreground focus:ring-0 text-sm"
                />
                <Button 
                    disabled={!phone || smsMutation.isPending}
                    onClick={() => smsMutation.mutate(phone)}
                    className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest"
                >
                    {smsMutation.isPending ? <RefreshCw className="animate-spin" size={14} /> : 'SMS'}
                </Button>
                </div>
            )}
        </div>
      )}

      {/* The Actual Ticket Preview */}
      <div className="relative group">
        <div className="absolute inset-0 bg-border blur-xl -m-4 rounded-full pointer-events-none group-hover:bg-muted/40 transition-all duration-700" />
        
        <div className={cn(
            "relative bg-white text-black shadow-2xl rounded-sm p-4 sm:p-8 min-h-[400px] overflow-hidden",
            format === 'invoice' ? "aspect-[1/1.414]" : "max-w-[340px] mx-auto"
        )}>
          {/* Jagged bottom edge effect (only for small receipt) */}
          {format === 'receipt' && (
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_8px,#fff_8px)] bg-[length:16px_16px] pointer-events-none" />
          )}
          
          <div
            id="receipt-print"
            className={cn(
                "receipt-container leading-relaxed",
                format === 'receipt' ? "text-[11px] font-mono" : "text-[13px] font-sans"
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          
          {/* Subtle paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/p6.png')] opacity-[0.03]" />
        </div>
      </div>

      <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
        {format === 'receipt' ? 'Ticket numérique certifié SMARTFLOW' : 'Facture normalisée certifiée SMARTFLOW'}
      </p>
    </div>
  )
}
