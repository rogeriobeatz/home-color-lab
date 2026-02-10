import { Plus, X, Pencil, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Room } from '@/types/project';
import { Input } from '@/components/ui/input';

interface EnvironmentCardsProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onAddRoom: () => void;
  onRemoveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
}

export function EnvironmentCards({
  rooms,
  activeRoomId,
  onSelectRoom,
  onAddRoom,
  onRemoveRoom,
  onRenameRoom,
}: EnvironmentCardsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(room.id);
    setEditName(room.name);
  };

  const confirmEdit = (roomId: string) => {
    if (editName.trim()) {
      onRenameRoom(roomId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {rooms.map(room => (
        <div
          key={room.id}
          onClick={() => onSelectRoom(room.id)}
          className={cn(
            "relative flex-shrink-0 w-36 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 group",
            activeRoomId === room.id
              ? "border-primary shadow-medium"
              : "border-border hover:border-primary/50"
          )}
        >
          <img
            src={room.processedImage || room.originalImage}
            alt={room.name}
            className="w-full h-20 object-cover"
          />
          <div className="p-2 bg-card">
            {editingId === room.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmEdit(room.id)}
                  className="h-6 text-xs px-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); confirmEdit(room.id); }}
                  className="text-primary hover:text-primary/80"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground truncate flex-1">
                  {room.name}
                </p>
                <button
                  onClick={(e) => startEditing(room, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          {rooms.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveRoom(room.id); }}
              className="absolute top-1 right-1 w-5 h-5 bg-card/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* Add room card */}
      <button
        onClick={onAddRoom}
        className="flex-shrink-0 w-36 h-[calc(5rem+2.5rem)] rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors bg-secondary/30 hover:bg-secondary/60"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">Adicionar</span>
      </button>
    </div>
  );
}
