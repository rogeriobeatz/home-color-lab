import { useState, useCallback } from 'react';
import { ProjectState, RoomElement, initialProjectState, defaultElements } from '@/types/project';

export function useProject() {
  const [state, setState] = useState<ProjectState>(initialProjectState);

  const setOriginalImage = useCallback((image: string) => {
    setState(prev => ({
      ...prev,
      originalImage: image,
      elements: defaultElements,
    }));
  }, []);

  const setProcessedImage = useCallback((image: string) => {
    setState(prev => ({
      ...prev,
      processedImage: image,
    }));
  }, []);

  const setElements = useCallback((elements: RoomElement[]) => {
    setState(prev => ({
      ...prev,
      elements,
    }));
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedElementId: elementId,
    }));
  }, []);

  const updateElementColor = useCallback((
    elementId: string,
    color: string,
    colorName: string,
    colorCode: string,
    colorBrand: string
  ) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId
          ? { ...el, color, colorName, colorCode, colorBrand }
          : el
      ),
    }));
  }, []);

  const setProcessing = useCallback((isProcessing: boolean, step?: string) => {
    setState(prev => ({
      ...prev,
      isProcessing,
      processingStep: step || '',
    }));
  }, []);

  const resetProject = useCallback(() => {
    setState(initialProjectState);
  }, []);

  return {
    state,
    setOriginalImage,
    setProcessedImage,
    setElements,
    selectElement,
    updateElementColor,
    setProcessing,
    resetProject,
  };
}
