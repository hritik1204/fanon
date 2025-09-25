import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  startAfter,
  getDocs,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/src/firebase';

const PAGE_SIZE = 8;

export const useEvents = () => {
  const [events, setEvents] = useState<DocumentData[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [eventCount, setEventCount] = useState(0);

  const eventCountRef = useRef<number>(0);

  // Get total event count
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const coll = collection(db, 'events');
        const snapshot = await getCountFromServer(coll);
        if (isMounted) {
          const count = snapshot.data().count;
          eventCountRef.current = count;
          setEventCount(count);
        }
      } catch (e) {
        console.warn('Failed to get total events count', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time listener for events
  useEffect(() => {
    const q = query(
      collection(db, 'events'),
      orderBy('startTime', 'asc'),
      limit(PAGE_SIZE)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: any[] = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

        setEvents(docs);
        if (!snap.empty) {
          setLastDoc(snap.docs[snap.docs.length - 1]);
          setHasMore(snap.size >= PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      },
      (err) => {
        console.warn('Realtime listener error:', err);
      }
    );

    return () => {
      unsub();
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !lastDoc) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('startTime', 'asc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const docs: any[] = [];
      snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

      setEvents((prev) => [...prev, ...docs]);

      if (!snap.empty) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
        if (snap.size < PAGE_SIZE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDoc]);

  const updateEventCount = useCallback(async () => {
    try {
      const snapshot = await getCountFromServer(collection(db, 'events'));
      const count = snapshot.data().count;
      eventCountRef.current = count;
      setEventCount(count);
    } catch (e) {
      console.warn('Failed to update event count', e);
    }
  }, []);

  return {
    events,
    loading,
    hasMore,
    eventCount,
    eventCountRef,
    loadMore,
    updateEventCount,
  };
};
