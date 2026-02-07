import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoomElement } from '@/types/project';

interface ElementSelectorProps {
  elements: RoomElement[];
  selectedElementId: string | null;
  onElementSelect: (elementId: string) => void;
}

export function ElementSelector({ elements, selectedElementId, onElementSelect }: ElementSelectorProps) {
  const getElementIcon = (type: RoomElement['type']) => {
    switch (type) {
      case 'wall':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
          </svg>
        );
      case 'ceiling':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h18M5 5v14h14V5" />
          </svg>
        );
      case 'floor':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19h16M4 19V9l8-6 8 6v10" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground mb-3">Elementos do Ambiente</h3>
      
      {elements.map(element => (
        <button
          key={element.id}
          onClick={() => onElementSelect(element.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
            selectedElementId === element.id
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            element.color ? "" : "bg-secondary"
          )}
          style={element.color ? { backgroundColor: element.color } : undefined}
          >
            {!element.color && (
              <span className="text-muted-foreground">
                {getElementIcon(element.type)}
              </span>
            )}
          </div>
          
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground text-sm">{element.name}</p>
            {element.colorName ? (
              <p className="text-xs text-muted-foreground">
                {element.colorName} - {element.colorCode}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Sem cor definida</p>
            )}
          </div>
          
          {selectedElementId === element.id && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
