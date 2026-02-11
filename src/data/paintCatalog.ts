// Catálogo de cores de marcas reais brasileiras
export interface PaintColor {
  id: string;
  name: string;
  code: string;
  hex: string;
  brand: 'suvinil' | 'coral' | 'sherwin-williams';
  category: 'neutros' | 'quentes' | 'frios' | 'pasteis' | 'vibrantes';
  rgb?: string;
  cmyk?: string;
  ral?: string;
  ncs?: string;
}

export const paintCatalog: PaintColor[] = [
  // Suvinil - Neutros
  { id: 'suv-001', name: 'Branco Neve', code: 'B001', hex: '#FFFFFF', brand: 'suvinil', category: 'neutros' },
  { id: 'suv-002', name: 'Gelo', code: 'E401', hex: '#F5F5F5', brand: 'suvinil', category: 'neutros' },
  { id: 'suv-003', name: 'Algodão Egípcio', code: 'W001', hex: '#FAF9F6', brand: 'suvinil', category: 'neutros' },
  { id: 'suv-004', name: 'Areia', code: 'C124', hex: '#D4C4A8', brand: 'suvinil', category: 'neutros' },
  { id: 'suv-005', name: 'Cinza Urbano', code: 'C351', hex: '#9A9A9A', brand: 'suvinil', category: 'neutros' },
  { id: 'suv-006', name: 'Carvão', code: 'C471', hex: '#4A4A4A', brand: 'suvinil', category: 'neutros' },
  
  // Suvinil - Quentes
  { id: 'suv-007', name: 'Flamingo', code: 'R124', hex: '#FF6B6B', brand: 'suvinil', category: 'quentes' },
  { id: 'suv-008', name: 'Terracota', code: 'O215', hex: '#CB6843', brand: 'suvinil', category: 'quentes' },
  { id: 'suv-009', name: 'Mostarda', code: 'Y305', hex: '#E4A82B', brand: 'suvinil', category: 'quentes' },
  { id: 'suv-010', name: 'Coral Vivo', code: 'O142', hex: '#FF7F50', brand: 'suvinil', category: 'quentes' },
  { id: 'suv-011', name: 'Pêssego', code: 'O089', hex: '#FFCBA4', brand: 'suvinil', category: 'quentes' },
  
  // Suvinil - Frios
  { id: 'suv-012', name: 'Azul Céu', code: 'B215', hex: '#87CEEB', brand: 'suvinil', category: 'frios' },
  { id: 'suv-013', name: 'Azul Profundo', code: 'B342', hex: '#1E3A5F', brand: 'suvinil', category: 'frios' },
  { id: 'suv-014', name: 'Verde Menta', code: 'G124', hex: '#98FF98', brand: 'suvinil', category: 'frios' },
  { id: 'suv-015', name: 'Verde Floresta', code: 'G287', hex: '#228B22', brand: 'suvinil', category: 'frios' },
  { id: 'suv-016', name: 'Turquesa', code: 'G156', hex: '#40E0D0', brand: 'suvinil', category: 'frios' },
  
  // Suvinil - Pastéis
  { id: 'suv-017', name: 'Rosa Quartzo', code: 'P089', hex: '#FFB6C1', brand: 'suvinil', category: 'pasteis' },
  { id: 'suv-018', name: 'Lavanda', code: 'P142', hex: '#E6E6FA', brand: 'suvinil', category: 'pasteis' },
  { id: 'suv-019', name: 'Menta Suave', code: 'P187', hex: '#B2DFDB', brand: 'suvinil', category: 'pasteis' },
  { id: 'suv-020', name: 'Pérola', code: 'P215', hex: '#FDF5E6', brand: 'suvinil', category: 'pasteis' },
  
  // Coral - Neutros
  { id: 'cor-001', name: 'Branco Coral', code: 'BC001', hex: '#FEFEFE', brand: 'coral', category: 'neutros' },
  { id: 'cor-002', name: 'Marfim', code: 'MF042', hex: '#FFFFF0', brand: 'coral', category: 'neutros' },
  { id: 'cor-003', name: 'Concreto', code: 'CN156', hex: '#7D7D7D', brand: 'coral', category: 'neutros' },
  { id: 'cor-004', name: 'Grafite', code: 'GF089', hex: '#3D3D3D', brand: 'coral', category: 'neutros' },
  
  // Coral - Quentes
  { id: 'cor-005', name: 'Vermelho Paixão', code: 'VP215', hex: '#DC143C', brand: 'coral', category: 'quentes' },
  { id: 'cor-006', name: 'Laranja Vibrante', code: 'LV089', hex: '#FF8C00', brand: 'coral', category: 'quentes' },
  { id: 'cor-007', name: 'Amarelo Sol', code: 'AS124', hex: '#FFD700', brand: 'coral', category: 'quentes' },
  { id: 'cor-008', name: 'Caramelo', code: 'CR067', hex: '#C68E17', brand: 'coral', category: 'quentes' },
  
  // Coral - Frios
  { id: 'cor-009', name: 'Azul Oceano', code: 'AO256', hex: '#006994', brand: 'coral', category: 'frios' },
  { id: 'cor-010', name: 'Verde Natureza', code: 'VN187', hex: '#2E8B57', brand: 'coral', category: 'frios' },
  { id: 'cor-011', name: 'Roxo Místico', code: 'RM142', hex: '#7B68EE', brand: 'coral', category: 'frios' },
  
  // Coral - Pastéis
  { id: 'cor-012', name: 'Rosa Bebê', code: 'RB078', hex: '#F4C2C2', brand: 'coral', category: 'pasteis' },
  { id: 'cor-013', name: 'Azul Sereno', code: 'AS056', hex: '#B0E0E6', brand: 'coral', category: 'pasteis' },
  { id: 'cor-014', name: 'Verde Suave', code: 'VS089', hex: '#C1E1C1', brand: 'coral', category: 'pasteis' },
  
  // Sherwin-Williams - Neutros
  { id: 'sw-001', name: 'Extra White', code: 'SW 7006', hex: '#F6F6F2', brand: 'sherwin-williams', category: 'neutros' },
  { id: 'sw-002', name: 'Agreeable Gray', code: 'SW 7029', hex: '#D1CBC1', brand: 'sherwin-williams', category: 'neutros' },
  { id: 'sw-003', name: 'Repose Gray', code: 'SW 7015', hex: '#C2BDB6', brand: 'sherwin-williams', category: 'neutros' },
  { id: 'sw-004', name: 'Accessible Beige', code: 'SW 7036', hex: '#D1C6B4', brand: 'sherwin-williams', category: 'neutros' },
  { id: 'sw-005', name: 'Iron Ore', code: 'SW 7069', hex: '#434341', brand: 'sherwin-williams', category: 'neutros' },
  
  // Sherwin-Williams - Quentes
  { id: 'sw-006', name: 'Coral Reef', code: 'SW 6606', hex: '#FF7F7F', brand: 'sherwin-williams', category: 'quentes' },
  { id: 'sw-007', name: 'Cavern Clay', code: 'SW 7701', hex: '#B5826D', brand: 'sherwin-williams', category: 'quentes' },
  { id: 'sw-008', name: 'Amber Wave', code: 'SW 6657', hex: '#EDA749', brand: 'sherwin-williams', category: 'quentes' },
  
  // Sherwin-Williams - Frios
  { id: 'sw-009', name: 'Naval', code: 'SW 6244', hex: '#2E3D4F', brand: 'sherwin-williams', category: 'frios' },
  { id: 'sw-010', name: 'Evergreen Fog', code: 'SW 9130', hex: '#8D9485', brand: 'sherwin-williams', category: 'frios' },
  { id: 'sw-011', name: 'Sea Salt', code: 'SW 6204', hex: '#CBDED2', brand: 'sherwin-williams', category: 'frios' },
  
  // Sherwin-Williams - Vibrantes
  { id: 'sw-012', name: 'Tricorn Black', code: 'SW 6258', hex: '#353535', brand: 'sherwin-williams', category: 'vibrantes' },
  { id: 'sw-013', name: 'Emerald', code: 'SW 6781', hex: '#287D7D', brand: 'sherwin-williams', category: 'vibrantes' },
  { id: 'sw-014', name: 'Passionate Purple', code: 'SW 6981', hex: '#7B4B94', brand: 'sherwin-williams', category: 'vibrantes' },
];

export const brandLogos: Record<string, string> = {
  'suvinil': 'Suvinil',
  'coral': 'Coral',
  'sherwin-williams': 'Sherwin-Williams',
};

export const categoryLabels: Record<string, string> = {
  'neutros': 'Neutros',
  'quentes': 'Quentes',
  'frios': 'Frios',
  'pasteis': 'Pastéis',
  'vibrantes': 'Vibrantes',
};
