import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Receipt, ShoppingBag, Truck, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PendingOrdersModal({ open, onOpenChange }) {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: () => ordersApi.activePending().then(res => res.data),
    enabled: open,
    refetchInterval: 10000, 
  });

  const handleSelectOrder = (order) => {
    if (order.is_cake) {
      navigate(`/cakes`);
    } else {
      navigate(`/pos?order=${order.id}&type=${order.type}`);
    }
    onOpenChange(false);
  };

  const getIcon = (type) => {
    switch (type) {
        case 'takeaway': return <ShoppingBag className="w-5 h-5" />;
        case 'gozem': return <Truck className="w-5 h-5" />;
        case 'cakes': return <Cookie className="w-5 h-5" />;
        default: return <ShoppingBag className="w-5 h-5" />;
    }
  }

  const getColor = (type) => {
    switch (type) {
        case 'takeaway': return 'bg-blue-500 text-white';
        case 'gozem': return 'bg-emerald-500 text-white';
        case 'cakes': return 'bg-pink-500 text-white';
        default: return 'bg-primary text-primary-foreground';
    }
  }

  const getLabel = (type) => {
      switch (type) {
          case 'takeaway': return 'Emporter';
          case 'gozem': return 'Gozem';
          case 'cakes': return 'Gâteau';
          default: return 'Commande';
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-[20px]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-black flex items-center gap-2 tracking-tighter">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            EN COURS
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            Sélectionnez une commande à emporter ou gâteau pour continuer
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">Chargement...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <p className="text-lg font-black text-muted-foreground uppercase tracking-tight">Aucune commande en cours</p>
              <p className="text-sm text-muted-foreground">Toutes les commandes sont terminées.</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <button
                    key={order.id + '-' + order.type}
                    onClick={() => handleSelectOrder(order)}
                    className="group relative flex flex-col p-4 bg-muted/30 hover:bg-purple-500/5 border border-border hover:border-purple-500/50 rounded-[15px] transition-all duration-300 text-left overflow-hidden shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${getColor(order.type)}`}>
                          {getIcon(order.type)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{getLabel(order.type)}</p>
                          <p className="font-black text-foreground text-sm leading-none">#{order.order_number}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-black text-[10px] uppercase tracking-tighter">
                        En cours
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-foreground">
                          {new Intl.NumberFormat('fr-FR').format(order.total || 0)} FCFA
                        </span>
                      </div>
                      {(order.waiter || order.customer_name) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{order.customer_name || order.waiter?.first_name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold uppercase tracking-widest text-xs text-purple-600">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
