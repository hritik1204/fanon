import { useState } from 'react';

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

export const useAnswerFlow = () => {
  const [answerModeId, setAnswerModeId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  const startAnswerFlow = (question: Question) => {
    setAnswerModeId(question.id);
    setAnswerDrafts((s) => ({ ...s, [question.id]: s[question.id] ?? '' }));
  };

  const cancelAnswerFlow = (question: Question) => {
    setAnswerModeId(null);
    setAnswerDrafts((s) => {
      const copy = { ...s };
      delete copy[question.id];
      return copy;
    });
  };

  const updateAnswerDraft = (questionId: string, text: string) => {
    setAnswerDrafts((s) => ({ ...s, [questionId]: text }));
  };

  return {
    answerModeId,
    answerDrafts,
    startAnswerFlow,
    cancelAnswerFlow,
    updateAnswerDraft,
  };
};
