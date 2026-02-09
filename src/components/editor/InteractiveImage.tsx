import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { RoomElement } from '@/types/project';
import { PaintColor } from '@/data/paintCatalog';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface InteractiveImageProps {
  beforeImage: string;
  afterImage: string;
  elements: RoomElement[];
  selectedElementId: string | null;
  onElementSelect: (elementId: string) => void;
  onColorDrop: (elementId: string, color: PaintColor) => void;
}

// Map elements to approximate image zones
const elementZones: Record<string, { top: string; left: string; width: string; height: string; label: string }> = {
  'wall-1': { top: '10%', left: '5%', width: '45%', height: '65%', label: 'Parede Principal' },
  'wall-2': { top: '10%', left: '50%', width: '45%', height: '65%', label: 'Parede Lateral' },
  'ceiling': { top: '0%', left: '5%', width: '90%', height: '15%', label: 'Teto' },
  'floor': { top: '75%', left: '5%', width: '90%', height: '25%', label: 'Piso' },
};

export function InteractiveImage({
  beforeImage,
  afterImage,
  elements,
  selectedElementId,
  onElementSelect,
  onColorDrop,
}: InteractiveImageProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverZone(elementId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverZone(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    setDragOverZone(null);
    try {
      const colorData = e.dataTransfer.getData('application/json');
      if (colorData) {
        const color: PaintColor = JSON.parse(colorData);
        onColorDrop(elementId, color);
      }
    } catch (err) {
      console.error('Invalid drop data', err);
    }
  }, [onColorDrop]);

  const paintableElements = elements.filter(el => el.type === 'wall' || el.type === 'ceiling' || el.type === 'floor');

  return (
    <div className="relative group/image">
      <BeforeAfterSlider
        beforeImage={beforeImage}
        afterImage={afterImage}
        className="aspect-[4/3] shadow-large"
      />

      {/* Clickable/droppable zones overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {paintableElements.map(element => {
          const zone = elementZones[element.id];
          if (!zone) return null;

          const isSelected = selectedElementId === element.id;
          const isHovered = hoveredZone === element.id;
          const isDragOver = dragOverZone === element.id;

          return (
            <div
              key={element.id}
              className={cn(
                'absolute pointer-events-auto cursor-pointer transition-all duration-200 rounded-lg border-2',
                isSelected
                  ? 'border-primary bg-primary/15'
                  : isHovered || isDragOver
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-transparent hover:border-primary/30 hover:bg-primary/5'
              )}
              style={{
                top: zone.top,
                left: zone.left,
                width: zone.width,
                height: zone.height,
              }}
              onClick={() => onElementSelect(element.id)}
              onMouseEnter={() => setHoveredZone(element.id)}
              onMouseLeave={() => setHoveredZone(null)}
              onDragOver={(e) => handleDragOver(e, element.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, element.id)}
            >
              {/* Label */}
              <div
                className={cn(
                  'absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm transition-opacity duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground opacity-100'
                    : isHovered || isDragOver
                    ? 'bg-card/90 text-foreground opacity-100'
                    : 'opacity-0 group-hover/image:opacity-60 bg-card/80 text-foreground'
                )}
              >
                {element.name}
                {element.colorName && (
                  <span className="ml-1 opacity-70">• {element.colorName}</span>
                )}
              </div>

              {/* Drop indicator */}
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-pulse">
                    Soltar cor aqui
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
