import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface ProcessingOverlayProps {
  step: string;
  progress?: number;
}

export function ProcessingOverlay({ step, progress = 0 }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card rounded-2xl shadow-large p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-soft">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Analisando sua imagem
        </h3>
        
        <p className="text-muted-foreground mb-6">
          {step || 'Preparando...'}
        </p>
        
        <Progress value={progress} className="h-2" />
        
        <p className="text-sm text-muted-foreground mt-4">
          Isso pode levar alguns segundos...
        </p>
      </div>
    </div>
  );
}
