import React from 'react'
import { cn } from '@/lib/utils'

export default function CategoryTabs({ categories = [], active, onChange }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto max-h-full pb-4 pr-1 custom-scrollbar">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={cn(
            'w-full px-2 py-3 rounded-[12px] text-[10px] sm:text-xs font-black uppercase tracking-wider text-center transition-all border shadow-sm flex items-center justify-center',
            active === cat.id
              ? 'bg-primary border-primary text-primary-foreground shadow-primary/20 scale-[1.02]'
              : 'bg-card text-muted-foreground border-border hover:border-primary/20'
          )}
          title={cat.name}
        >
          <span className="truncate w-full">{cat.name}</span>
        </button>
      ))}
    </div>
  )
}
