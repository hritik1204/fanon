import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/src/firebase';

export type Question = {
  id: string;
  text: string;
  authorId: string;
  createdAt?: any;
  likes?: number;
  state?: 'asked' | 'answered' | 'private';
  answerText?: string;
  answeredBy?: string;
  answeredAt?: any;
  selected?: boolean;
};

export const useQuestions = (eventId: string, tab: 'asked' | 'answered' | 'private') => {
  const [questions, setQuestions] = useState<Question[]>([]);

  // Load questions initially ordered by likes then realtime merges
  useEffect(() => {
    if (!eventId) return;
    let unsubRealtime: (() => void) | null = null;
    let cancelled = false;

    async function initialLoadAndListen() {
      try {
        const qInitial = query(
          collection(db, 'events', eventId, 'questions'),
          orderBy('likes', 'desc'),
          orderBy('createdAt', 'asc'),
          limit(200)
        );
        const snap = await getDocs(qInitial);
        if (cancelled) return;
        const initial: Question[] = [];
        snap.forEach((d) => initial.push({ id: d.id, ...(d.data() as any) }));
        setQuestions(initial);

        const qRealtime = query(
          collection(db, 'events', eventId, 'questions'),
          orderBy('createdAt', 'asc')
        );
        unsubRealtime = onSnapshot(qRealtime, (s) => {
          setQuestions((prev) => {
            const map = new Map<string, any>();
            prev.forEach((p) => map.set(p.id, p));
            s.docChanges().forEach((chg) => {
              const id = chg.doc.id;
              const data = { id, ...(chg.doc.data() as any) };
              if (chg.type === 'removed') {
                map.delete(id);
              } else {
                map.set(id, data);
              }
            });
            return Array.from(map.values());
          });
        });
      } catch (err: any) {
        console.warn('initialLoadAndListen error:', err);
        // fallback to createdAt ordering
        try {
          const fallback = query(
            collection(db, 'events', eventId, 'questions'),
            orderBy('createdAt', 'asc'),
            limit(200)
          );
          const snap2 = await getDocs(fallback);
          const initial2: Question[] = [];
          snap2.forEach((d) =>
            initial2.push({ id: d.id, ...(d.data() as any) })
          );
          setQuestions(initial2);
        } catch (e) {
          console.warn('fallback query failed', e);
        }
      }
    }

    initialLoadAndListen();

    return () => {
      cancelled = true;
      if (unsubRealtime) unsubRealtime();
    };
  }, [eventId]);

  // Filtering + sorting for each tab
  const filteredQuestions = useMemo(() => {
    const arr = questions.filter((q) => (q.state || 'asked') === tab);
    if (tab === 'asked') {
      return arr.sort(
        (a, b) =>
          (b.likes || 0) - (a.likes || 0) ||
          (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
    }
    if (tab === 'answered') {
      return arr.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
    }
    // private
    return arr.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
  }, [questions, tab]);

  return { questions, filteredQuestions, setQuestions };
};
