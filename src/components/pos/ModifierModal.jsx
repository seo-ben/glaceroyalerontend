import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Check, Info } from 'lucide-react';

export default function ModifierModal({ open, product, onConfirm, onClose }) {
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  useEffect(() => {
    if (open && product) {
      // Initialiser avec les modificateurs par défaut si nécessaire
      setSelectedModifiers([]);
    }
  }, [open, product]);

  if (!product) return null;

  const handleToggleModifier = (modifier, group) => {
    const isSelected = selectedModifiers.some(m => m.id === modifier.id);
    
    if (group.multiple) {
      if (isSelected) {
        setSelectedModifiers(selectedModifiers.filter(m => m.id !== modifier.id));
      } else {
        setSelectedModifiers([...selectedModifiers, modifier]);
      }
    } else {
      // Pour les groupes à choix unique (Radio), on remplace le modificateur du même groupe
      const otherGroupsModifiers = selectedModifiers.filter(m => 
        !group.modifiers.some(gm => gm.id === m.id)
      );
      setSelectedModifiers([...otherGroupsModifiers, modifier]);
    }
  };

  const isGroupValid = (group) => {
    if (!group.required) return true;
    const selectionsInGroup = selectedModifiers.filter(m => 
      group.modifiers.some(gm => gm.id === m.id)
    );
    return selectionsInGroup.length > 0;
  };

  const allGroupsValid = (product.modifier_groups || product.modifierGroups || []).every(isGroupValid);

  const handleConfirm = () => {
    if (allGroupsValid) {
      onConfirm(product, selectedModifiers);
      onClose();
    }
  };

  const groups = product.modifier_groups || product.modifierGroups || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border rounded-[2rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                {product.emoji || '🍽️'}
             </div>
             <div>
                <DialogTitle className="text-sm font-black uppercase tracking-widest">{product.name}</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Personnaliser l'article</p>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
          {groups.map(group => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                    {group.name}
                    {group.required && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">OBLIGATOIRE</span>}
                </Label>
                <span className="text-[9px] text-muted-foreground font-bold italic">
                    {group.multiple ? 'Choix multiples' : 'Un seul choix'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {group.modifiers.map(modifier => {
                  const isSelected = selectedModifiers.some(m => m.id === modifier.id);
                  return (
                    <button
                      key={modifier.id}
                      onClick={() => handleToggleModifier(modifier, group)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "bg-muted/30 border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                            isSelected ? "bg-primary border-primary" : "bg-background border-border"
                        )}>
                            {isSelected && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-primary" : "text-foreground")}>
                            {modifier.name}
                        </span>
                      </div>
                      {modifier.extra_price > 0 && (
                        <span className="text-[9px] font-black italic text-primary">+{formatAmount(modifier.extra_price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
             <div className="py-10 text-center space-y-2">
                <Info size={32} className="mx-auto text-muted-foreground/30" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Aucune option disponible pour ce produit</p>
             </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-border flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl">
            Annuler
          </Button>
          <Button 
            disabled={!allGroupsValid}
            onClick={handleConfirm}
            className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
          >
            Ajouter au panier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
