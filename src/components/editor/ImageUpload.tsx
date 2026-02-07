import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void;
  isProcessing?: boolean;
}

export function ImageUpload({ onImageUpload, isProcessing }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleConfirm = useCallback(() => {
    if (preview) {
      onImageUpload(preview);
    }
  }, [preview, onImageUpload]);

  const handleClear = useCallback(() => {
    setPreview(null);
  }, []);

  if (preview) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden shadow-large bg-card">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto max-h-[500px] object-contain"
          />
          <button
            onClick={handleClear}
            className="absolute top-4 right-4 w-10 h-10 bg-card/90 backdrop-blur rounded-full flex items-center justify-center shadow-medium hover:bg-card transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
        
        <div className="mt-6 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isProcessing}
          >
            Escolher outra
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="gradient-accent text-accent-foreground"
          >
            {isProcessing ? 'Processando...' : 'Analisar com IA'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "w-full max-w-2xl mx-auto border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-secondary/50"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id="image-upload"
      />
      
      <label htmlFor="image-upload" className="cursor-pointer block">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          {isDragging ? (
            <ImageIcon className="w-10 h-10 text-primary" />
          ) : (
            <Upload className="w-10 h-10 text-primary" />
          )}
        </div>
        
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {isDragging ? 'Solte a imagem aqui' : 'Arraste sua foto ou clique para selecionar'}
        </h3>
        
        <p className="text-muted-foreground mb-6">
          Suporta JPG, PNG e WEBP até 10MB
        </p>
        
        <Button variant="outline" className="pointer-events-none">
          <Upload className="w-4 h-4 mr-2" />
          Selecionar arquivo
        </Button>
      </label>
    </div>
  );
}
