import { useState } from 'react';
import { ArrowLeft, Download, FileText, Palette, Layers, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [activeTab, setActiveTab] = useState('colors');
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

    toast({
      title: 'Cor aplicada!',
      description: `${color.name} aplicada ao elemento selecionado.`,
    });

    // TODO: Call AI to apply color to the image
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
              
              {/* Mobile color panel trigger */}
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
                    <div className="mt-4 h-full overflow-hidden">
                      <MobileSidebar
                        state={state}
                        selectedElement={selectedElement}
                        onElementSelect={selectElement}
                        onColorSelect={handleColorSelect}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          ) : null}
        </main>

        {/* Sidebar - Desktop only */}
        {state.processedImage && (
          <aside className="hidden lg:flex w-80 border-l border-border bg-card flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-full rounded-none border-b border-border h-12 bg-transparent">
                <TabsTrigger value="colors" className="flex-1 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <PaintBucket className="w-4 h-4 mr-2" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="elements" className="flex-1 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  <Layers className="w-4 h-4 mr-2" />
                  Elementos
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="colors" className="h-full m-0 p-4">
                  {selectedElement ? (
                    <ColorCatalog
                      onColorSelect={handleColorSelect}
                      selectedColorId={state.elements.find(el => el.id === state.selectedElementId)?.color}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Selecione um elemento</p>
                      <p className="text-sm mt-1">Vá para a aba "Elementos" e escolha uma parede, teto ou piso.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="elements" className="h-full m-0 p-4 overflow-auto">
                  <ElementSelector
                    elements={state.elements}
                    selectedElementId={state.selectedElementId}
                    onElementSelect={selectElement}
                  />
                  
                  <div className="mt-6 pt-6 border-t border-border">
                    <SelectedColorsPanel elements={state.elements} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
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

// Mobile sidebar content
function MobileSidebar({
  state,
  selectedElement,
  onElementSelect,
  onColorSelect,
  activeTab,
  setActiveTab,
}: {
  state: ReturnType<typeof useProject>['state'];
  selectedElement: ReturnType<typeof useProject>['state']['elements'][0] | undefined;
  onElementSelect: (id: string) => void;
  onColorSelect: (color: PaintColor) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="w-full">
        <TabsTrigger value="elements" className="flex-1">
          <Layers className="w-4 h-4 mr-2" />
          Elementos
        </TabsTrigger>
        <TabsTrigger value="colors" className="flex-1">
          <PaintBucket className="w-4 h-4 mr-2" />
          Cores
        </TabsTrigger>
      </TabsList>
      
      <ScrollArea className="flex-1 mt-4">
        <TabsContent value="elements" className="m-0">
          <ElementSelector
            elements={state.elements}
            selectedElementId={state.selectedElementId}
            onElementSelect={onElementSelect}
          />
          
          <div className="mt-6 pt-6 border-t border-border">
            <SelectedColorsPanel elements={state.elements} />
          </div>
        </TabsContent>
        
        <TabsContent value="colors" className="m-0">
          {selectedElement ? (
            <ColorCatalog onColorSelect={onColorSelect} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Selecione um elemento primeiro</p>
            </div>
          )}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
