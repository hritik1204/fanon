import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/firebase';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!auth || !auth.currentUser) return;
    
    const uid = auth.currentUser.uid;
    const uRef = doc(db, 'users', uid);
    
    getDoc(uRef).then((snap) => {
      if (snap.exists()) {
        setUserProfile({ uid, ...(snap.data() as any) });
      } else {
        setUserProfile({ uid: uid });
      }
    });
  }, []);

  return { userProfile };
};
