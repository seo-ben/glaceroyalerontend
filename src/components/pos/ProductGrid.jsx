import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import { Plus } from 'lucide-react'

export default function ProductGrid({ products = [], onAdd, isLoading }) {

  // Dynamic storage URL builder
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}/storage/${url}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-24 rounded-[10px] bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground/30 text-[9px] font-black uppercase tracking-[0.3em]">
        Aucun produit trouvé
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-8">
      {products.map(product => {
        const isOutOfStock = product.track_stock && parseFloat(product.quantity || 0) <= 0
        const isAvailable  = (product.available ?? true) && !isOutOfStock
        const prodImg      = getImageUrl(product.image_url)

        return (
          <button
            key={product.id}
            onClick={() => onAdd(product)}
            disabled={!isAvailable}
            className={cn(
              'relative rounded-[10px] border p-2 text-left transition-all group overflow-hidden',
              'bg-card border-border hover:border-primary/50 hover:bg-muted/50',
              'active:scale-[0.97]',
              !isAvailable && 'opacity-40 cursor-not-allowed grayscale'
            )}
          >
            <p className="text-[12px] font-black text-foreground leading-snug uppercase tracking-tight line-clamp-2 h-8">{product.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-primary font-black text-[13px] italic tracking-tighter">{formatAmount(product.price)}</span>
              <div className="w-5 h-5 rounded-md bg-primary shadow-lg shadow-primary/10 flex items-center justify-center transition-transform duration-300">
                <Plus size={10} className="text-primary-foreground" />
              </div>
            </div>

            {!isAvailable && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                 <span className="text-[7px] font-black uppercase tracking-widest text-destructive-foreground bg-destructive px-2 py-0.5 rounded-full">
                    {isOutOfStock ? 'Rupture' : 'Indisponible'}
                 </span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
