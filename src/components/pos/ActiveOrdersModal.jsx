import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Receipt, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ActiveOrdersModal({ open, onOpenChange }) {
  const navigate = useNavigate();

  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ['tables-occupied'],
    queryFn: () => apiClient.get('/tables/occupied').then(res => res.data),
    enabled: open,
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes si ouvert
  });

  const handleSelectTable = (table) => {
    if (table.current_order) {
      navigate(`/pos?table=${table.id}&order=${table.current_order.id}&type=dine_in`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-[20px]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-black flex items-center gap-2 tracking-tighter">
            <Utensils className="w-6 h-6 text-primary" />
            TABLES OCCUPÉES
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            Sélectionnez une table pour continuer la commande
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground animate-pulse">Chargement des tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Utensils className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <p className="text-lg font-black text-muted-foreground uppercase tracking-tight">Aucune table occupée</p>
              <p className="text-sm text-muted-foreground">Toutes les tables sont actuellement libres.</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className="group relative flex flex-col p-4 bg-muted/30 hover:bg-primary/5 border border-border hover:border-primary/50 rounded-[15px] transition-all duration-300 text-left overflow-hidden shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-lg">
                          {table.number}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Table</p>
                          <p className="font-black text-foreground text-lg leading-none">N° {table.number}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-black text-[10px] uppercase tracking-tighter">
                        {table.occupation_minutes} min
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-foreground">
                          {new Intl.NumberFormat('fr-FR').format(table.current_order?.total || 0)} FCFA
                        </span>
                      </div>
                      {table.assigned_user && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{table.assigned_user.first_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover effect indicator */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold uppercase tracking-widest text-xs">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
