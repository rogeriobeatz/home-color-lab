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
import { EnvironmentCards } from './EnvironmentCards';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditorViewProps {
  onBack: () => void;
}

export function EditorView({ onBack }: EditorViewProps) {
  const {
    state, activeRoom, addRoom, setActiveRoom, updateRoomName, removeRoom,
    setRoomProcessedImage, setRoomElements, selectElement, updateElementColor, setProcessing,
  } = useProject();
  const { toast } = useToast();
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const handleImageUpload = async (imageData: string) => {
    const roomId = addRoom(imageData);
    setShowUpload(false);
    setProcessing(true, 'Analisando ambiente com IA...');
    setProcessingProgress(10);

    try {
      setProcessingProgress(30);
      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: { image: imageData }
      });

      if (error) throw error;

      setProcessingProgress(70);

      // Update room name from AI if available
      if (data?.analysis?.roomName) {
        updateRoomName(roomId, data.analysis.roomName);
      }

      // Update elements from AI if available
      if (data?.analysis?.elements) {
        const aiElements = data.analysis.elements
          .filter((el: any) => el.canPaint)
          .map((el: any) => ({
            id: el.id,
            name: el.name,
            type: el.type as any,
          }));
        if (aiElements.length > 0) {
          setRoomElements(roomId, aiElements);
        }
      }

      setProcessingProgress(100);
      setProcessing(false);

      toast({
        title: 'Ambiente analisado!',
        description: 'Selecione elementos e aplique cores.',
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setProcessing(false);
      toast({
        title: 'Ambiente adicionado',
        description: 'Selecione elementos e aplique cores manualmente.',
      });
    }
  };

  const handleColorSelect = async (color: PaintColor) => {
    if (!activeRoom?.selectedElementId) {
      toast({
        title: 'Selecione um elemento',
        description: 'Escolha uma parede, teto ou piso antes de aplicar a cor.',
        variant: 'destructive',
      });
      return;
    }

    updateElementColor(
      activeRoom.selectedElementId,
      color.hex,
      color.name,
      color.code,
      color.brand
    );

    const element = activeRoom.elements.find(el => el.id === activeRoom.selectedElementId);
    if (element && activeRoom.originalImage) {
      setProcessing(true, `Aplicando ${color.name}...`);
      setProcessingProgress(20);

      try {
        setProcessingProgress(50);
        const { data, error } = await supabase.functions.invoke('apply-color', {
          body: {
            image: activeRoom.processedImage || activeRoom.originalImage,
            elementType: element.type === 'wall' ? element.name : element.type,
            color: color.hex,
            colorName: color.name,
          }
        });

        if (error) throw error;
        setProcessingProgress(90);

        if (data?.success && data?.image) {
          setRoomProcessedImage(activeRoom.id, data.image);
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
    }
  };

  const handleDownload = () => {
    if (!activeRoom?.processedImage) return;
    const link = document.createElement('a');
    link.href = activeRoom.processedImage;
    link.download = `decorai-${activeRoom.name}.png`;
    link.click();
    toast({ title: 'Imagem baixada!', description: 'Sua imagem foi salva com sucesso.' });
  };

  const handleGeneratePDF = async () => {
    if (state.rooms.length === 0) return;
    setProcessing(true, 'Gerando PDF consolidado...');
    setProcessingProgress(30);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: {
          rooms: state.rooms.map(r => ({
            name: r.name,
            originalImage: r.originalImage,
            processedImage: r.processedImage,
            elements: r.elements.filter(el => el.color),
          })),
        }
      });

      if (error) throw error;
      setProcessingProgress(90);

      if (data?.pdf) {
        const link = document.createElement('a');
        link.href = data.pdf;
        link.download = 'decorai-relatorio.pdf';
        link.click();
        toast({ title: 'PDF gerado!', description: 'Relatório com todos os ambientes.' });
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleAddRoom = () => {
    setShowUpload(true);
  };

  const selectedElement = activeRoom?.elements.find(el => el.id === activeRoom.selectedElementId);
  const hasRooms = state.rooms.length > 0;
  const showUploadArea = !hasRooms || showUpload;

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

        {hasRooms && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <FileText className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
            {activeRoom?.processedImage && (
              <Button size="sm" onClick={handleDownload} className="gradient-accent text-accent-foreground">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 overflow-auto">
          {showUploadArea ? (
            <div className="h-full flex flex-col items-center justify-center">
              {hasRooms && (
                <Button variant="ghost" className="mb-4" onClick={() => setShowUpload(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao editor
                </Button>
              )}
              <ImageUpload onImageUpload={handleImageUpload} isProcessing={state.isProcessing} />
            </div>
          ) : activeRoom ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <BeforeAfterSlider
                beforeImage={activeRoom.originalImage}
                afterImage={activeRoom.processedImage}
                className="aspect-[4/3] shadow-large"
              />

              {/* Environment cards */}
              <EnvironmentCards
                rooms={state.rooms}
                activeRoomId={state.activeRoomId}
                onSelectRoom={setActiveRoom}
                onAddRoom={handleAddRoom}
                onRemoveRoom={removeRoom}
                onRenameRoom={updateRoomName}
              />

              {/* Mobile panel trigger */}
              <div className="lg:hidden">
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
                      <SidebarContent
                        room={activeRoom}
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
        {activeRoom && !showUpload && (
          <aside className="hidden lg:flex w-80 border-l border-border bg-card flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <PaintBucket className="w-4 h-4" />
                Editor de Cores
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <SidebarContent
                  room={activeRoom}
                  selectedElement={selectedElement}
                  onElementSelect={selectElement}
                  onColorSelect={handleColorSelect}
                />
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>

      {state.isProcessing && (
        <ProcessingOverlay step={state.processingStep} progress={processingProgress} />
      )}
    </div>
  );
}

function SidebarContent({
  room,
  selectedElement,
  onElementSelect,
  onColorSelect,
}: {
  room: import('@/types/project').Room;
  selectedElement: import('@/types/project').RoomElement | undefined;
  onElementSelect: (id: string) => void;
  onColorSelect: (color: PaintColor) => void;
}) {
  return (
    <div className="space-y-6">
      <ElementSelector
        elements={room.elements}
        selectedElementId={room.selectedElementId}
        onElementSelect={onElementSelect}
      />
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {selectedElement ? `Cores para: ${selectedElement.name}` : 'Selecione um elemento acima'}
        </h3>
        {selectedElement ? (
          <ColorCatalog
            onColorSelect={onColorSelect}
            selectedColorId={room.elements.find(el => el.id === room.selectedElementId)?.color}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Escolha uma parede, teto ou piso para ver as cores disponíveis.
          </p>
        )}
      </div>
      {room.elements.some(el => el.color) && (
        <>
          <Separator />
          <SelectedColorsPanel elements={room.elements} />
        </>
      )}
    </div>
  );
}
