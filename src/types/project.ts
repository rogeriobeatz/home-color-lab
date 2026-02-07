export interface RoomElement {
  id: string;
  name: string;
  type: 'wall' | 'ceiling' | 'floor' | 'door' | 'window' | 'furniture';
  color?: string;
  colorName?: string;
  colorCode?: string;
  colorBrand?: string;
}

export interface ProjectState {
  originalImage: string | null;
  processedImage: string | null;
  elements: RoomElement[];
  selectedElementId: string | null;
  isProcessing: boolean;
  processingStep: string;
}

export const initialProjectState: ProjectState = {
  originalImage: null,
  processedImage: null,
  elements: [],
  selectedElementId: null,
  isProcessing: false,
  processingStep: '',
};

export const defaultElements: RoomElement[] = [
  { id: 'wall-1', name: 'Parede Principal', type: 'wall' },
  { id: 'wall-2', name: 'Parede Lateral', type: 'wall' },
  { id: 'ceiling', name: 'Teto', type: 'ceiling' },
  { id: 'floor', name: 'Piso', type: 'floor' },
];
