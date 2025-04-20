import { useState, useCallback } from 'react';
import type { Selection } from '@/app/types/daw';

export function useSelectionManager() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{
    trackId: string;
    beat: number;
  } | null>(null);

  // Start selection on a track
  const startSelection = useCallback((trackId: string, beat: number) => {
    setIsSelecting(true);
    setSelectionStart({ trackId, beat });
    setSelection({
      trackId,
      startBeat: beat,
      endBeat: beat,
    });
  }, []);

  // Update selection while dragging
  const updateSelection = useCallback(
    (beat: number) => {
      if (!isSelecting || !selectionStart) return;

      const trackId = selectionStart.trackId;
      const startBeat = selectionStart.beat;

      setSelection({
        trackId,
        startBeat: Math.min(startBeat, beat),
        endBeat: Math.max(startBeat, beat),
      });
    },
    [isSelecting, selectionStart],
  );

  // End selection
  const endSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
    setSelectionStart(null);
  }, []);

  // Calculate selection style based on pixel width
  const getSelectionStyle = useCallback(
    (beatWidth: number = 64) => {
      if (!selection) return {};
      return {
        left: `${(selection.startBeat - 1) * beatWidth}px`,
        width: `${(selection.endBeat - selection.startBeat + 1) * beatWidth}px`,
      };
    },
    [selection],
  );

  return {
    selection,
    isSelecting,
    selectionStart,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    getSelectionStyle,
  };
}
