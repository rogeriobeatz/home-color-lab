import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Palette, PaintBucket, Home } from 'lucide-react';
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
import type { CompanyPaint } from '@/pages/CompanyPage';

interface EditorViewProps {
  onBack: () => void;
  companyName?: string;
  companyLogo?: string | null;
  companyPaints?: CompanyPaint[];
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

/** Convert a hex color (#RRGGBB) to HSL string "H S% L%" */
function hexToHsl(hex: string): string | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function EditorView({ onBack, companyName, companyLogo, companyPaints, primaryColor, secondaryColor }: EditorViewProps) {
  const {
    state, activeRoom, addRoom, setActiveRoom, updateRoomName, removeRoom,
    setRoomProcessedImage, setRoomElements, selectElement, updateElementColor, setProcessing,
  } = useProject();
  const { toast } = useToast();
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const isWhiteLabel = !!companyName;

  // Compute CSS variable overrides for company branding
  const brandingStyle = useMemo(() => {
    if (!primaryColor) return undefined;
    const hsl = hexToHsl(primaryColor);
    if (!hsl) return undefined;
    const style: Record<string, string> = { '--primary': hsl, '--ring': hsl };
    if (secondaryColor) {
      const secHsl = hexToHsl(secondaryColor);
      if (secHsl) style['--accent'] = secHsl;
    }
    return style as React.CSSProperties;
  }, [primaryColor, secondaryColor]);

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

      if (data?.analysis?.roomName) {
        updateRoomName(roomId, data.analysis.roomName);
      }

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
    <div className="min-h-screen bg-background flex flex-col" style={brandingStyle}>
      {/* Header */}
      <header className="h-16 border-b border-border px-4 flex items-center justify-between bg-card shadow-soft">
        <div className="flex items-center gap-4">
          {!isWhiteLabel && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="h-9 w-auto object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <span className="font-display font-bold text-foreground text-lg leading-tight block">
                {companyName || 'DecorAI'}
              </span>
              {isWhiteLabel && (
                <span className="text-[10px] text-muted-foreground leading-none">
                  Simulador de Cores
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isWhiteLabel && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><Home className="w-4 h-4 mr-1" /> Início</Link>
            </Button>
          )}

          {hasRooms && (
            <>
              <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF
              </Button>
              {activeRoom?.processedImage && (
                <Button size="sm" onClick={handleDownload} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
          {showUploadArea ? (
            <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto">
              {hasRooms && (
                <Button variant="ghost" className="mb-4" onClick={() => setShowUpload(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao editor
                </Button>
              )}

              {/* Welcome banner for white-label */}
              {isWhiteLabel && !hasRooms && (
                <div className="text-center mb-8 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Palette className="w-4 h-4" />
                    Experiência personalizada por {companyName}
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                    Visualize suas cores
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Envie uma foto do seu ambiente e experimente as cores do nosso catálogo exclusivo em tempo real.
                  </p>
                </div>
              )}

              <ImageUpload onImageUpload={handleImageUpload} isProcessing={state.isProcessing} />

              {/* Powered by footer for white-label */}
              {isWhiteLabel && (
                <p className="mt-8 text-xs text-muted-foreground/60">
                  Tecnologia por <span className="font-medium">DecorAI</span>
                </p>
              )}
            </div>
          ) : activeRoom ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="relative">
                <BeforeAfterSlider
                  beforeImage={activeRoom.originalImage}
                  afterImage={activeRoom.processedImage}
                  className="aspect-[4/3] shadow-large rounded-2xl"
                />
                {/* Clickable element pills overlaid on image */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center z-10">
                  {activeRoom.elements.map(el => (
                    <button
                      key={el.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectElement(el.id);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
                        activeRoom.selectedElementId === el.id
                          ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                      style={el.color ? { borderLeft: `4px solid ${el.color}` } : undefined}
                    >
                      {el.name}
                    </button>
                  ))}
                </div>
              </div>

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
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
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
                        companyPaints={companyPaints}
                      />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          ) : null}
          </div>
        </main>

        {/* Sidebar - Desktop only */}
        {activeRoom && !showUpload && (
          <aside className="hidden lg:flex w-80 border-l border-border bg-card flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <PaintBucket className="w-4 h-4 text-primary" />
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
                  companyPaints={companyPaints}
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
  companyPaints,
}: {
  room: import('@/types/project').Room;
  selectedElement: import('@/types/project').RoomElement | undefined;
  onElementSelect: (id: string) => void;
  onColorSelect: (color: PaintColor) => void;
  companyPaints?: CompanyPaint[];
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
            companyPaints={companyPaints}
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
