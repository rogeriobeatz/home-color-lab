import { useState, useCallback } from 'react';
import { ProjectState, Room, RoomElement, initialProjectState, defaultElements } from '@/types/project';

export function useProject() {
  const [state, setState] = useState<ProjectState>(initialProjectState);

  const addRoom = useCallback((image: string, name?: string): string => {
    const id = `room-${Date.now()}`;
    const room: Room = {
      id,
      name: name || `Ambiente ${state.rooms.length + 1}`,
      originalImage: image,
      processedImage: image,
      elements: defaultElements.map(el => ({ ...el })),
      selectedElementId: null,
    };
    setState(prev => ({
      ...prev,
      rooms: [...prev.rooms, room],
      activeRoomId: id,
    }));
    return id;
  }, [state.rooms.length]);

  const setActiveRoom = useCallback((roomId: string) => {
    setState(prev => ({ ...prev, activeRoomId: roomId }));
  }, []);

  const updateRoomName = useCallback((roomId: string, name: string) => {
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, name } : r),
    }));
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setState(prev => {
      const rooms = prev.rooms.filter(r => r.id !== roomId);
      return {
        ...prev,
        rooms,
        activeRoomId: prev.activeRoomId === roomId
          ? (rooms.length > 0 ? rooms[0].id : null)
          : prev.activeRoomId,
      };
    });
  }, []);

  const setRoomProcessedImage = useCallback((roomId: string, image: string) => {
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, processedImage: image } : r),
    }));
  }, []);

  const setRoomElements = useCallback((roomId: string, elements: RoomElement[]) => {
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === roomId ? { ...r, elements } : r),
    }));
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r =>
        r.id === prev.activeRoomId ? { ...r, selectedElementId: elementId } : r
      ),
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
      rooms: prev.rooms.map(r =>
        r.id === prev.activeRoomId
          ? {
              ...r,
              elements: r.elements.map(el =>
                el.id === elementId
                  ? { ...el, color, colorName, colorCode, colorBrand }
                  : el
              ),
            }
          : r
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

  // Derived state for the active room
  const activeRoom = state.rooms.find(r => r.id === state.activeRoomId) || null;

  return {
    state,
    activeRoom,
    addRoom,
    setActiveRoom,
    updateRoomName,
    removeRoom,
    setRoomProcessedImage,
    setRoomElements,
    selectElement,
    updateElementColor,
    setProcessing,
    resetProject,
  };
}
