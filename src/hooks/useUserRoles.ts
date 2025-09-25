import { useState, useEffect } from 'react';
import { auth } from '@/src/firebase';

export const useUserRoles = (event: any, userProfile: any) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setIsAdmin(false);
    setIsGuest(false);
    const uid = auth?.currentUser?.uid;
    if (!uid) return;

    const globalAdmin = !!(userProfile && userProfile.isAdmin === true);
    const eventAdmin = !!(
      event &&
      Array.isArray(event.adminIds) &&
      event.adminIds.includes(uid)
    );
    const eventGuest = !!(
      event &&
      Array.isArray(event.guests) &&
      event.guests
        .map((g: any) => String(g).trim())
        .includes(String(uid).trim())
    );

    setIsAdmin(globalAdmin || eventAdmin);
    setIsGuest(eventGuest);
  }, [event, userProfile]);

  return { isAdmin, isGuest };
};
