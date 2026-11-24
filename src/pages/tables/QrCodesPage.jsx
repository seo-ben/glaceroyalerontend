import { useQuery } from '@tanstack/react-query'
import { tablesApi } from '@/api/tables'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Printer, QrCode as QrIcon } from 'lucide-react'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export default function QrCodesPage() {
  const printRef = useRef(null)

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['all-tables-qr'],
    queryFn:  () => tablesApi.allTables().then(r => r.data)
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'QR_Codes_Tables',
  })

  // URL de base pour l'affichage (depuis le .env ou fallback)
  const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5174'

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-10 w-48 rounded-[var(--radius)]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 rounded-[calc(var(--radius)*1.5)]" />)}
      </div>
    </div>
  )

  return (
    <div className="p-8 pb-20 space-y-8">
      {/* Header - Masqué à l'impression */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[calc(var(--radius)*2)] border shadow-xl print:hidden transition-all">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[var(--radius)] bg-primary/10 flex items-center justify-center text-primary">
                <QrIcon size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Codes QR des Tables</h1>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Générez et imprimez vos codes QR</p>
             </div>
          </div>
        </div>
        <Button 
          onClick={() => handlePrint()} 
          className="rounded-full h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
        >
          <Printer size={18} />
          Imprimer tout
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.open(`${import.meta.env.VITE_API_URL}/qr-download`, '_blank')}
          className="rounded-full h-12 px-8 font-bold gap-2 shadow-lg"
        >
          <Printer size={18} />
          Télécharger PDF (FPDF)
        </Button>
      </div>

      {/* Grid of QR Codes - Ce bloc sera imprimé */}
      <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 print:block print:w-full print:p-4">
        {tables.map(table => (
          <div 
            key={table.id} 
            className="group relative bg-white border-2 border-border rounded-[calc(var(--radius)*1.5)] p-6 flex flex-col items-center text-center transition-all hover:border-primary hover:shadow-2xl print:shadow-none print:border-2 print:border-gray-200 print:rounded-none print:mb-8 print:break-inside-avoid print:page-break-after-auto print:w-[45%] print:inline-flex print:mr-[4%] print:float-left"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 print:text-black print:font-bold">Scannez pour commander</p>
            
            <div className="relative w-40 h-40 bg-muted rounded-[var(--radius)] overflow-hidden mb-4 border-2 border-transparent group-hover:border-primary/20 transition-all print:border-none print:w-48 print:h-48">
              <img 
                src={`${import.meta.env.VITE_API_URL}/qr/${table.id}`} 
                alt={`Table ${table.number}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1">
                <p className="text-xs font-black uppercase text-primary tracking-widest opacity-50 print:text-black">Table</p>
                <p className="text-4xl font-black italic tracking-tighter uppercase leading-none print:text-black">N° {table.number}</p>
            </div>

            {/* URL affichée en bas du QR pour l'impression */}
            <div className="mt-4 pt-4 border-t border-border w-full print:border-gray-400">
                <p className="text-[10px] font-bold text-muted-foreground tracking-tight print:text-black break-all">
                   {baseUrl}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground opacity-50 print:hidden mt-2">Capacité: {table.capacity} pers.</p>
            </div>

            <div className="mt-2 hidden print:block text-[8px] font-black uppercase tracking-widest text-gray-400 italic">
               SMARTFLOW POS - Restaurant Professionnel
            </div>
          </div>
        ))}
        {/* Clearfix for float layout in print */}
        <div className="clear-both" />
      </div>

      {/* Instructions impression */}
      <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[calc(var(--radius)*1.5)] text-orange-800 text-sm print:hidden">
        <h4 className="font-black uppercase tracking-widest text-xs mb-2">💡 Conseil d'impression</h4>
        <p className="font-medium">Pour un meilleur rendu, utilisez du papier cartonné et réglez les marges d'impression sur "Aucune" dans les paramètres de votre navigateur.</p>
      </div>
    </div>
  )
}
