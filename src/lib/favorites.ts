import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getSessionId } from './utils';

const sessionId = getSessionId();

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadFavorites = useCallback(async () => {
    const { data } = await supabase
      .from('favorites')
      .select('turf_id')
      .eq('session_id', sessionId);
    if (data) {
      setFavorites(data.map((f) => f.turf_id));
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (turfId: string) => favorites.includes(turfId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (turfId: string) => {
      if (favorites.includes(turfId)) {
        setFavorites((prev) => prev.filter((id) => id !== turfId));
        await supabase
          .from('favorites')
          .delete()
          .eq('session_id', sessionId)
          .eq('turf_id', turfId);
      } else {
        setFavorites((prev) => [...prev, turfId]);
        await supabase
          .from('favorites')
          .insert({ session_id: sessionId, turf_id: turfId });
      }
    },
    [favorites]
  );

  return { favorites, isFavorite, toggleFavorite, loadFavorites };
}
