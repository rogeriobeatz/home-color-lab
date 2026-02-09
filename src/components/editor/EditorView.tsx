import { useState, useCallback } from 'react';
import { ArrowLeft, Download, FileText, Palette, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProject } from '@/hooks/useProject';
import { PaintColor } from '@/data/paintCatalog';
import { ImageUpload } from './ImageUpload';
import { ColorCatalog } from './ColorCatalog';
import { ElementSelector } from './ElementSelector';
import { SelectedColorsPanel } from './SelectedColorsPanel';
import { InteractiveImage } from './InteractiveImage';
import { ProcessingOverlay } from './ProcessingOverlay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditorViewProps {
  onBack: () => void;
}

export function EditorView({ onBack }: EditorViewProps) {
  const { state, setOriginalImage, setProcessedImage, selectElement, updateElementColor, setProcessing } = useProject();
  const { toast } = useToast();
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleImageUpload = async (imageData: string) => {
    setOriginalImage(imageData);
    setProcessing(true, 'Enviando imagem...');
    setProcessingProgress(10);

    try {
      setProcessingProgress(30);
      setProcessing(true, 'Identificando elementos do ambiente...');
      
      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: { image: imageData }
      });

      if (error) throw error;

      setProcessingProgress(70);
      setProcessing(true, 'Preparando editor...');
      setProcessedImage(imageData);
      setProcessingProgress(100);
      setProcessing(false);

      toast({
        title: 'Imagem analisada!',
        description: 'Clique nas áreas da imagem ou arraste cores do catálogo.',
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setProcessing(false);
      setProcessedImage(imageData);
      toast({
        title: 'Imagem carregada',
        description: 'Clique nas áreas da imagem para selecionar e arraste cores.',
      });
    }
  };

  const applyColorToImage = useCallback(async (elementId: string, color: PaintColor) => {
    const element = state.elements.find(el => el.id === elementId);
    if (!element || !state.originalImage) return;

    // Update state immediately
    updateElementColor(elementId, color.hex, color.name, color.code, color.brand);
    selectElement(elementId);

    // Call AI to modify image
    setProcessing(true, `Aplicando ${color.name}...`);
    setProcessingProgress(20);

    try {
      setProcessingProgress(50);
      const { data, error } = await supabase.functions.invoke('apply-color', {
        body: {
          image: state.processedImage || state.originalImage,
          elementType: element.type === 'wall' ? element.name : element.type,
          color: color.hex,
          colorName: color.name,
        }
      });

      if (error) throw error;

      setProcessingProgress(90);

      if (data?.success && data?.image) {
        setProcessedImage(data.image);
        toast({ title: 'Cor aplicada!', description: `${color.name} aplicada com sucesso.` });
      } else {
        toast({
          title: 'Cor registrada',
          description: `${color.name} selecionada, mas a visualização não pôde ser gerada.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error applying color:', err);
      toast({
        title: 'Erro ao aplicar cor',
        description: 'Não foi possível gerar a visualização. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  }, [state.elements, state.originalImage, state.processedImage, updateElementColor, selectElement, setProcessing, setProcessedImage, toast]);

  const handleColorSelect = (color: PaintColor) => {
    if (!state.selectedElementId) {
      toast({
        title: 'Selecione um elemento',
        description: 'Clique em uma área da imagem ou escolha um elemento na lista.',
        variant: 'destructive',
      });
      return;
    }
    applyColorToImage(state.selectedElementId, color);
  };

  const handleColorDrop = (elementId: string, color: PaintColor) => {
    applyColorToImage(elementId, color);
  };

  const handleDownload = () => {
    if (!state.processedImage) return;
    const link = document.createElement('a');
    link.href = state.processedImage;
    link.download = 'decorai-resultado.png';
    link.click();
    toast({ title: 'Imagem baixada!', description: 'Sua imagem foi salva com sucesso.' });
  };

  const handleGeneratePDF = async () => {
    toast({ title: 'Em breve!', description: 'A geração de PDF estará disponível em breve.' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border px-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Palette className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground text-sm">DecorAI</span>
          </div>
        </div>
        
        {state.processedImage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <FileText className="w-4 h-4 mr-1.5" />
              PDF
            </Button>
            <Button size="sm" onClick={handleDownload} className="gradient-accent text-accent-foreground">
              <Download className="w-4 h-4 mr-1.5" />
              Baixar
            </Button>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image area */}
        <main className="flex-1 p-4 overflow-auto flex items-center justify-center">
          {!state.originalImage ? (
            <ImageUpload onImageUpload={handleImageUpload} isProcessing={state.isProcessing} />
          ) : state.processedImage ? (
            <div className="w-full max-w-4xl">
              <InteractiveImage
                beforeImage={state.originalImage}
                afterImage={state.processedImage}
                elements={state.elements}
                selectedElementId={state.selectedElementId}
                onElementSelect={selectElement}
                onColorDrop={handleColorDrop}
              />

              {/* Hint */}
              <p className="text-center text-xs text-muted-foreground mt-3">
                Clique nas áreas da imagem para selecionar • Arraste cores do catálogo para aplicar
              </p>

              {/* Mobile trigger */}
              <div className="lg:hidden mt-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="w-full" size="lg">
                      <PaintBucket className="w-5 h-5 mr-2" />
                      Escolher cores
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh]">
                    <SheetHeader>
                      <SheetTitle>Editor de Cores</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="mt-4 h-[calc(80vh-80px)]">
                      <SidebarContent
                        state={state}
                        onElementSelect={selectElement}
                        onColorSelect={handleColorSelect}
                      />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          ) : null}
        </main>

        {/* Sidebar - Desktop - Single column */}
        {state.processedImage && (
          <aside className="hidden lg:flex w-80 border-l border-border bg-card flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <SidebarContent
                  state={state}
                  onElementSelect={selectElement}
                  onColorSelect={handleColorSelect}
                />
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>

      {/* Processing overlay */}
      {state.isProcessing && (
        <ProcessingOverlay step={state.processingStep} progress={processingProgress} />
      )}
    </div>
  );
}

// Single-column sidebar content used in both desktop and mobile
function SidebarContent({
  state,
  onElementSelect,
  onColorSelect,
}: {
  state: ReturnType<typeof useProject>['state'];
  onElementSelect: (id: string) => void;
  onColorSelect: (color: PaintColor) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Elements */}
      <ElementSelector
        elements={state.elements}
        selectedElementId={state.selectedElementId}
        onElementSelect={onElementSelect}
      />

      {/* Colors */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <PaintBucket className="w-4 h-4" />
          Catálogo de Cores
          {!state.selectedElementId && (
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              Selecione um elemento ↑
            </span>
          )}
        </h3>
        <div className={!state.selectedElementId ? 'opacity-50 pointer-events-none' : ''}>
          <ColorCatalog
            onColorSelect={onColorSelect}
            selectedColorId={state.elements.find(el => el.id === state.selectedElementId)?.color}
          />
        </div>
      </div>

      {/* Selected colors summary */}
      <div className="border-t border-border pt-4">
        <SelectedColorsPanel elements={state.elements} />
      </div>
    </div>
  );
}
