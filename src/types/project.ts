export interface RoomElement {
  id: string;
  name: string;
  type: 'wall' | 'ceiling' | 'floor' | 'door' | 'window' | 'furniture';
  color?: string;
  colorName?: string;
  colorCode?: string;
  colorBrand?: string;
}

export interface Room {
  id: string;
  name: string;
  originalImage: string;
  processedImage: string;
  elements: RoomElement[];
  selectedElementId: string | null;
}

export interface ProjectState {
  rooms: Room[];
  activeRoomId: string | null;
  isProcessing: boolean;
  processingStep: string;
}

export const initialProjectState: ProjectState = {
  rooms: [],
  activeRoomId: null,
  isProcessing: false,
  processingStep: '',
};

export const defaultElements: RoomElement[] = [
  { id: 'wall-1', name: 'Parede Principal', type: 'wall' },
  { id: 'wall-2', name: 'Parede Lateral', type: 'wall' },
  { id: 'ceiling', name: 'Teto', type: 'ceiling' },
  { id: 'floor', name: 'Piso', type: 'floor' },
];
