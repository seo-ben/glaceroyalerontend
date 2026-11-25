import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChefHat, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrint } from '@/hooks/usePrint'
import { receiptsApi } from '@/api/receipts'
import { printToLocalDevice } from '@/lib/localPrinting'
import apiClient from '@/api/client'

// Mapping des destinations
const DESTINATIONS = [
  { id: 'kitchen', label: 'Cuisine', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'bar', label: 'Glaces', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/10' },
]

export default function KitchenPrintModal({ open, onOpenChange, orderId, requiredDestinations = null }) {
  
  const handlePrint = async (destId) => {
    if (!orderId) return;
    try {
        // 1. Récupérer l'HTML pour cette destination spécifique
        const { data } = await receiptsApi.kitchenHtml(orderId, destId);
        const htmlContent = typeof data === 'string' ? data : data.html;

        // 2. Récupérer les réglages (IP/Nom des imprimantes)
        const { data: settingsData } = await apiClient.get('/settings');
        const settings = settingsData.settings || {};

        // 3. Envoyer à l'imprimante locale via QZ Tray / RawBT
        await printToLocalDevice(htmlContent, destId, settings);
        
        console.log(`Impression lancée pour ${destId}`);
    } catch (err) {
        console.error('Erreur d\'impression destination:', err);
        // Fallback si QZ Tray n'est pas là
        window.open(`${import.meta.env.VITE_API_URL}/receipts/${orderId}/kitchen-ticket?destination=${destId}`, '_blank');
    }
  }

  // Filtrer les boutons si on a reçu une liste de destinations (pour n'afficher que ce qui est utile)
  const buttons = requiredDestinations && requiredDestinations.length > 0 
    ? DESTINATIONS.filter(d => requiredDestinations.includes(d.id))
    : DESTINATIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border text-foreground rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-10 pb-4 bg-muted/40 border-b border-border">
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">Imprimer les Bons</DialogTitle>
          <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2">Sélectionnez le poste de préparation pour ouvrir le bon d'impression</p>
        </DialogHeader>
        
        <div className="p-10 space-y-8">
          <div className="flex flex-wrap justify-center gap-6">
            {buttons.map(dest => (
              <button
                key={dest.id}
                className={cn(
                    "w-36 h-36 flex flex-col items-center justify-center gap-4 rounded-3xl border border-border transition-all hover:scale-105 active:scale-95 group",
                    dest.bg || "bg-muted"
                )}
                onClick={() => handlePrint(dest.id)}
              >
                <div className={cn("p-4 rounded-2xl bg-card border border-border shadow-sm group-hover:shadow-lg transition-all", dest.color)}>
                    <dest.icon size={36} />
                </div>
                <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground group-hover:text-foreground">{dest.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex justify-center pt-4">
              <Button variant="ghost" className="h-12 px-10 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-muted" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
