import { useState } from 'react';
import { ArrowLeft, Download, FileText, Palette, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProject } from '@/hooks/useProject';
import { PaintColor } from '@/data/paintCatalog';
import { ImageUpload } from './ImageUpload';
import { ColorCatalog } from './ColorCatalog';
import { ElementSelector } from './ElementSelector';
import { SelectedColorsPanel } from './SelectedColorsPanel';
import { BeforeAfterSlider } from './BeforeAfterSlider';
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
      
      // Call AI to analyze image
      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: { image: imageData }
      });

      if (error) throw error;

      setProcessingProgress(70);
      setProcessing(true, 'Preparando editor...');
      
      // For now, we'll use the original image as the "processed" one
      // The AI will modify it when colors are applied
      setProcessedImage(imageData);
      
      setProcessingProgress(100);
      setProcessing(false);

      toast({
        title: 'Imagem analisada!',
        description: 'Agora você pode selecionar elementos e aplicar cores.',
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setProcessing(false);
      
      // Even if AI fails, let user continue with manual selection
      setProcessedImage(imageData);
      
      toast({
        title: 'Imagem carregada',
        description: 'Você pode selecionar elementos e aplicar cores manualmente.',
      });
    }
  };

  const handleColorSelect = async (color: PaintColor) => {
    if (!state.selectedElementId) {
      toast({
        title: 'Selecione um elemento',
        description: 'Escolha uma parede, teto ou piso antes de aplicar a cor.',
        variant: 'destructive',
      });
      return;
    }

    updateElementColor(
      state.selectedElementId,
      color.hex,
      color.name,
      color.code,
      color.brand
    );

    // Call AI to apply color to the image
    const element = state.elements.find(el => el.id === state.selectedElementId);
    if (element && state.originalImage) {
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
          toast({
            title: 'Cor aplicada!',
            description: `${color.name} aplicada com sucesso.`,
          });
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
    }
  };

  const handleDownload = () => {
    if (!state.processedImage) return;
    
    const link = document.createElement('a');
    link.href = state.processedImage;
    link.download = 'decorai-resultado.png';
    link.click();
    
    toast({
      title: 'Imagem baixada!',
      description: 'Sua imagem foi salva com sucesso.',
    });
  };

  const handleGeneratePDF = async () => {
    toast({
      title: 'Em breve!',
      description: 'A geração de PDF estará disponível em breve.',
    });
  };

  const selectedElement = state.elements.find(el => el.id === state.selectedElementId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border px-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">DecorAI</span>
          </div>
        </div>
        
        {state.processedImage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <FileText className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
            <Button size="sm" onClick={handleDownload} className="gradient-accent text-accent-foreground">
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <main className="flex-1 p-6 overflow-auto">
          {!state.originalImage ? (
            <div className="h-full flex items-center justify-center">
              <ImageUpload onImageUpload={handleImageUpload} isProcessing={state.isProcessing} />
            </div>
          ) : state.originalImage && state.processedImage ? (
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage={state.originalImage}
                afterImage={state.processedImage}
                className="aspect-[4/3] shadow-large"
              />
              
              {/* Mobile panel trigger */}
              <div className="lg:hidden mt-6">
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
                    <ScrollArea className="mt-4 h-[calc(100%-2rem)]">
                      <UnifiedSidebar
                        state={state}
                        selectedElement={selectedElement}
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

        {/* Sidebar - Desktop only */}
        {state.processedImage && (
          <aside className="hidden lg:flex w-80 border-l border-border bg-card flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <PaintBucket className="w-4 h-4" />
                Editor de Cores
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <UnifiedSidebar
                  state={state}
                  selectedElement={selectedElement}
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

// Unified sidebar content — no tabs, single column
function UnifiedSidebar({
  state,
  selectedElement,
  onElementSelect,
  onColorSelect,
}: {
  state: ReturnType<typeof useProject>['state'];
  selectedElement: ReturnType<typeof useProject>['state']['elements'][0] | undefined;
  onElementSelect: (id: string) => void;
  onColorSelect: (color: PaintColor) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Section 1: Elements */}
      <ElementSelector
        elements={state.elements}
        selectedElementId={state.selectedElementId}
        onElementSelect={onElementSelect}
      />

      <Separator />

      {/* Section 2: Color Catalog */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {selectedElement
            ? `Cores para: ${selectedElement.name}`
            : 'Selecione um elemento acima'}
        </h3>
        {selectedElement ? (
          <ColorCatalog
            onColorSelect={onColorSelect}
            selectedColorId={state.elements.find(el => el.id === state.selectedElementId)?.color}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Escolha uma parede, teto ou piso para ver as cores disponíveis.
          </p>
        )}
      </div>

      {/* Section 3: Summary */}
      {state.elements.some(el => el.color) && (
        <>
          <Separator />
          <SelectedColorsPanel elements={state.elements} />
        </>
      )}
    </div>
  );
}
