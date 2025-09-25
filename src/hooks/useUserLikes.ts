import { useState, useEffect } from 'react';
import { auth } from '@/src/firebase';

export const useUserLikes = () => {
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const toggleLike = (questionId: string) => {
    setUserLikes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const removeLike = (questionId: string) => {
    setUserLikes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  const addLike = (questionId: string) => {
    setUserLikes((prev) => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      return newSet;
    });
  };

  return {
    userLikes,
    setUserLikes,
    toggleLike,
    removeLike,
    addLike,
  };
};
