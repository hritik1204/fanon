import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { horizontalScaleConversion } from '@/src/utils';
import { Colors } from '@/src/constants/theme';
import { Question } from '@/src/hooks/useQuestions';

interface QuestionCardProps {
  question: Question;
  userLikes: Set<string>;
  answerModeId: string | null;
  answerDrafts: Record<string, string>;
  isGuest: boolean;
  isAdmin: boolean;
  selectionMode: boolean;
  tab: 'asked' | 'answered' | 'private';
  onToggleSelect: (id: string) => void;
  onLike: (question: Question) => void;
  onStartAnswer: (question: Question) => void;
  onCancelAnswer: (question: Question) => void;
  onSubmitAnswer: (question: Question) => void;
  onDismiss: (question: Question) => void;
  onDelete: (ids: string[]) => void;
  onRecover: (id: string) => void;
  onUpdateAnswerDraft: (id: string, text: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  userLikes,
  answerModeId,
  answerDrafts,
  isGuest,
  isAdmin,
  selectionMode,
  tab,
  onToggleSelect,
  onLike,
  onStartAnswer,
  onCancelAnswer,
  onSubmitAnswer,
  onDismiss,
  onDelete,
  onRecover,
  onUpdateAnswerDraft,
}) => {
  const answering = answerModeId === question.id;

  return (
    <View style={styles.questionCard}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={styles.qText}>{question.text}</Text>
        {selectionMode && isAdmin ? (
          <TouchableOpacity
            onPress={() => onToggleSelect(question.id)}
            style={{ padding: horizontalScaleConversion(8) }}
          >
            <Text
              style={{
                color: question.selected ? Colors.light.background : '#999',
              }}
            >
              {question.selected ? '✓' : '◻'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* If answered, show answer text */}
      {question.state === 'answered' && question.answerText ? (
        <View style={{ paddingVertical: horizontalScaleConversion(8) }}>
          <Text style={{ color: '#9fd', fontStyle: 'italic' }}>
            Answer: {question.answerText}
          </Text>
          <Text style={{ color: '#666', fontSize: horizontalScaleConversion(12) }}>
            {question.answeredBy ? `By ${question.answeredBy}` : ''}
          </Text>
        </View>
      ) : null}

      {/* Inline answer input when answering */}
      {answering ? (
        <View
          style={{
            marginTop: 8,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            value={answerDrafts[question.id] ?? ''}
            onChangeText={(t) => onUpdateAnswerDraft(question.id, t)}
            placeholder="Type your answer..."
            placeholderTextColor="#777"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#333',
              padding: 8,
              borderRadius: 6,
              color: 'white',
              marginRight: 8,
            }}
          />
          <TouchableOpacity
            onPress={() => onSubmitAnswer(question)}
            style={[styles.qBtn]}
          >
            <Text style={styles.qBtnText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onCancelAnswer(question)}
            style={[
              styles.qBtn,
              { marginLeft: horizontalScaleConversion(8), backgroundColor: '#666' },
            ]}
          >
            <Text style={styles.qBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.qRow}>
        <Text style={styles.qMeta}>Likes: {question.likes ?? 0}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => onLike(question)}
            style={[styles.qBtn, userLikes.has(question.id) && styles.qBtnLiked]}
          >
            <Text
              style={[
                styles.qBtnText,
                userLikes.has(question.id) && styles.qBtnTextLiked,
              ]}
            >
              {userLikes.has(question.id) ? 'Unlike' : 'Like'}
            </Text>
          </TouchableOpacity>

          {((isGuest && tab === 'asked') || isAdmin) && !answering && (
            <>
              <TouchableOpacity
                onPress={() => onStartAnswer(question)}
                style={styles.qBtn}
              >
                <Text style={styles.qBtnText}>Answer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDismiss(question)}
                style={styles.qBtn}
              >
                <Text style={styles.qBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </>
          )}

          {isAdmin && !selectionMode && (
            <>
              <TouchableOpacity
                onPress={() => onDelete([question.id])}
                style={styles.qBtnDanger}
              >
                <Text style={styles.qBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onRecover(question.id)}
                style={styles.qBtn}
              >
                <Text style={styles.qBtnText}>Recover</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  questionCard: {
    padding: horizontalScaleConversion(12),
    borderBottomWidth: horizontalScaleConversion(1),
    borderBottomColor: '#222',
  },
  qText: {
    color: 'white',
    fontSize: horizontalScaleConversion(16),
    marginBottom: horizontalScaleConversion(8),
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qMeta: { color: '#aaa' },
  qBtn: {
    marginLeft: horizontalScaleConversion(8),
    paddingHorizontal: horizontalScaleConversion(10),
    paddingVertical: horizontalScaleConversion(6),
    borderRadius: 6,
    backgroundColor: '#444',
  },
  qBtnLiked: {
    backgroundColor: '#2b6ebf',
  },
  qBtnDanger: {
    marginLeft: horizontalScaleConversion(8),
    paddingHorizontal: horizontalScaleConversion(10),
    paddingVertical: horizontalScaleConversion(6),
    borderRadius: 6,
    backgroundColor: '#8b2b2b',
  },
  qBtnText: { color: 'white' },
  qBtnTextLiked: { color: 'white', fontWeight: '600' },
});
