import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/firebase';

export const useEvent = (eventId: string) => {
  const [event, setEvent] = useState<any>(null);
  const [submissionsPaused, setSubmissionsPaused] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    
    const eRef = doc(db, 'events', eventId);
    const unsub = onSnapshot(
      eRef,
      (snap) => {
        if (!snap.exists()) {
          setEvent(null);
          return;
        }
        const eventData = { id: snap.id, ...(snap.data() as any) };
        setEvent(eventData);
        setSubmissionsPaused(Boolean(eventData.submissionsPaused));
      },
      (err) => {
        console.warn('event onSnapshot error:', err);
      }
    );
    
    return () => unsub();
  }, [eventId]);

  return { event, submissionsPaused };
};
