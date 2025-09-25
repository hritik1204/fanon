import { useState, useCallback } from 'react';
import { seedDemoEvents } from '@/src/helper/demo-events';
import { horizontalScaleConversion } from '@/src/utils';

export const useDemoData = (eventCountRef: React.MutableRefObject<number>, updateEventCount: () => Promise<void>) => {
  const [seeding, setSeeding] = useState(false);

  const getDemoData = useCallback(async () => {
    setSeeding(true);
    try {
      await seedDemoEvents(horizontalScaleConversion(5), eventCountRef.current);
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
