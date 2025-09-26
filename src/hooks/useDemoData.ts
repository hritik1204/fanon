import { useState, useCallback } from 'react';
import { seedDemoEvents } from '@/src/helper/demo-events';


export const useDemoData = (eventCountRef: React.MutableRefObject<number>, updateEventCount: () => Promise<void>) => {
  const [seeding, setSeeding] = useState(false);

  const getDemoData = useCallback(async () => {
    setSeeding(true);
    try {
      await seedDemoEvents(5, eventCountRef.current);
      await updateEventCount();
    } finally {
      setSeeding(false);
    }
  }, [eventCountRef, updateEventCount]);

  return {
    seeding,
    getDemoData,
  };
};
