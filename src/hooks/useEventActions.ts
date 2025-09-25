import { useState } from 'react';
import { Alert } from 'react-native';
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebase';
import { useUserLikes } from './useUserLikes';
import { useAnswerFlow, Question } from './useAnswerFlow';
import { useRateLimiting } from './useRateLimiting';

export const useEventActions = (eventId: string, userProfile: any) => {
  const [posting, setPosting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  
  const { userLikes, removeLike, addLike, setUserLikes } = useUserLikes();
  const { answerModeId, answerDrafts, startAnswerFlow, cancelAnswerFlow, updateAnswerDraft } = useAnswerFlow();
  const { canShowToast, canSubmitQuestion } = useRateLimiting();

  // Show toast helper
  const showToast = (message: string) => {
    if (!canShowToast()) return;
   
    console.log('Toast:', message);
  };

  // Post a question
  const postQuestion = async (text: string) => {
    if (!auth?.currentUser) {
      Alert.alert('Sign in required', 'Please sign in to post questions.');
      return;
    }

    if (!canSubmitQuestion()) {
      return Alert.alert(
        'Rate limit',
        "You're submitting too fast. Try again in a moment."
      );
    }

    const uid = auth.currentUser.uid;
    setPosting(true);
    try {
      const qRef = collection(db, 'events', eventId, 'questions');
      await addDoc(qRef, {
        text: text.trim(),
        authorId: uid,
        createdAt: serverTimestamp(),
        likes: 0,
        state: 'asked',
      });
    } catch (err) {
      console.warn('postQuestion', err);
      Alert.alert('Failed', 'Could not post question. Try again.');
    } finally {
      setPosting(false);
    }
  };

  // Like a question
  const likeQuestion = async (question: Question) => {
    if (!auth?.currentUser) {
      Alert.alert('Sign in required', 'Please sign in to like.');
      return;
    }
    
    const uid = auth.currentUser.uid;
    const qDocRef = doc(db, 'events', eventId, 'questions', question.id);
    const likeDocRef = doc(
      db,
      'events',
      eventId,
      'questions',
      question.id,
      'likes',
      uid
    );

    try {
      await runTransaction(db, async (tx) => {
        const qSnap = await tx.get(qDocRef);
        if (!qSnap.exists()) throw new Error('Question missing');
        const likeSnap = await tx.get(likeDocRef);
        const currentLikes = qSnap.data().likes || 0;

        if (likeSnap.exists()) {
          // User already liked -> unlike
          tx.delete(likeDocRef);
          tx.update(qDocRef, { likes: Math.max(0, currentLikes - 1) });
          removeLike(question.id);
        } else {
          // Add like
          tx.set(likeDocRef, { uid, createdAt: serverTimestamp() });
          tx.update(qDocRef, { likes: currentLikes + 1 });
          addLike(question.id);
        }
      });
    } catch (err) {
      console.warn('likeQuestion error', err);
      Alert.alert('Like failed', 'Could not register your like. Try again.');
    }
  };

  // Submit answer
  const submitAnswer = async (question: Question, isGuest: boolean, isAdmin: boolean) => {
    if (!auth?.currentUser) {
      Alert.alert('Sign in required', 'Please sign in to answer.');
      return;
    }
    if (!isGuest && !isAdmin) {
      return Alert.alert(
        'Not allowed',
        'Only a guest or admin can answer questions.'
      );
    }
    
    const draft = (answerDrafts[question.id] || '').trim();
    if (!draft)
      return Alert.alert('Empty', 'Please type an answer before submitting.');

    try {
      const qDoc = doc(db, 'events', eventId, 'questions', question.id);
      await updateDoc(qDoc, {
        state: 'answered',
        answerText: draft,
        answeredBy: auth.currentUser.uid,
        answeredAt: serverTimestamp(),
      });
      // Show toast (rate-limited)
      showToast(`${userProfile?.displayName || 'Guest'} answered: "${question.text.slice(0, 60)}"`);
      // Clear answer UI
      cancelAnswerFlow(question.id);
    } catch (err) {
      console.warn('submitAnswer', err);
      Alert.alert('Failed', 'Could not submit answer. Try again.');
    }
  };

  // Dismiss question
  const dismissQuestion = async (question: Question, isGuest: boolean, isAdmin: boolean) => {
    if (!auth?.currentUser) return;
    if (!isGuest && !isAdmin) {
      return Alert.alert(
        'Not allowed',
        'Only a guest or admin can dismiss questions.'
      );
    }
    try {
      const qDoc = doc(db, 'events', eventId, 'questions', question.id);
      await updateDoc(qDoc, { state: 'private' });
    } catch (err) {
      console.warn('dismissQuestion', err);
    }
  };

  // Admin actions
  const adminDeleteQuestions = async (ids: string[], isAdmin: boolean) => {
    if (!isAdmin) return Alert.alert('Not allowed');
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const d = doc(db, 'events', eventId, 'questions', id);
        batch.delete(d);
      });
      await batch.commit();
      setSelectionMode(false);
    } catch (err) {
      console.warn('adminDeleteQuestions', err);
      Alert.alert('Failed', 'Could not delete questions.');
    }
  };

  const adminRecoverQuestion = async (id: string, isAdmin: boolean) => {
    if (!isAdmin) return;
    try {
      const qDoc = doc(db, 'events', eventId, 'questions', id);
      await updateDoc(qDoc, { state: 'asked' });
    } catch (err) {
      console.warn('adminRecoverQuestion', err);
      Alert.alert('Failed', 'Could not recover question.');
    }
  };

  return {
    posting,
    selectionMode,
    setSelectionMode,
    userLikes,
    answerModeId,
    answerDrafts,
    postQuestion,
    likeQuestion,
    submitAnswer,
    dismissQuestion,
    startAnswerFlow,
    cancelAnswerFlow,
    updateAnswerDraft,
    adminDeleteQuestions,
    adminRecoverQuestion,
    setUserLikes,
  };
};
