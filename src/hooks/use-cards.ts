import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { cards as cardsSchema, type Card, type NewCard } from '@/db/schema';
import { deleteCardImages } from '@/utils/image-loader';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const db = getDb();
    if (!db) return;
    const result = db.select().from(cardsSchema).orderBy(cardsSchema.createdAt).all();
    setCards(result);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const getCard = useCallback((id: string): Card | undefined => {
    const db = getDb();
    if (!db) return undefined;
    return db.select().from(cardsSchema).where(eq(cardsSchema.id, id)).get();
  }, []);

  const insertCard = useCallback((data: NewCard) => {
    const db = getDb();
    if (!db) throw new Error('DB not initialized');
    db.insert(cardsSchema).values(data).run();
    refresh();
  }, [refresh]);

  const updateCard = useCallback((id: string, data: { name?: string; note?: string | null }) => {
    const db = getDb();
    if (!db) return;
    db.update(cardsSchema)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(cardsSchema.id, id))
      .run();
    refresh();
  }, [refresh]);

  const deleteCard = useCallback(async (id: string) => {
    const db = getDb();
    if (!db) return;
    const card = db.select().from(cardsSchema).where(eq(cardsSchema.id, id)).get();
    if (card) {
      await deleteCardImages(card.frontImagePath, card.backImagePath);
    }
    db.delete(cardsSchema).where(eq(cardsSchema.id, id)).run();
    refresh();
  }, [refresh]);

  return { cards, loading, refresh, getCard, insertCard, updateCard, deleteCard };
}
