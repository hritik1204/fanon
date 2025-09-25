import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { horizontalScaleConversion } from '@/src/utils';

interface QuestionTabsProps {
  tab: 'asked' | 'answered' | 'private';
  isAdmin: boolean;
  isGuest: boolean;
  onTabChange: (tab: 'asked' | 'answered' | 'private') => void;
}

export const QuestionTabs: React.FC<QuestionTabsProps> = ({
  tab,
  isAdmin,
  isGuest,
  onTabChange,
}) => {
  return (
    <View style={styles.tabs}>
      <TouchableOpacity
        onPress={() => onTabChange('asked')}
        style={[styles.tabBtn, tab === 'asked' && styles.tabActive]}
      >
        <Text style={tab === 'asked' ? styles.tabActiveText : styles.tabText}>
          Asked
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onTabChange('answered')}
        style={[styles.tabBtn, tab === 'answered' && styles.tabActive]}
      >
        <Text
          style={tab === 'answered' ? styles.tabActiveText : styles.tabText}
        >
          Answered
        </Text>
      </TouchableOpacity>
      {(isAdmin || isGuest) && (
        <TouchableOpacity
          onPress={() => onTabChange('private')}
          style={[styles.tabBtn, tab === 'private' && styles.tabActive]}
        >
          <Text
            style={tab === 'private' ? styles.tabActiveText : styles.tabText}
          >
            Private
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScaleConversion(12),
    paddingBottom: horizontalScaleConversion(8),
  },
  tabBtn: {
    paddingVertical: horizontalScaleConversion(8),
    paddingHorizontal: horizontalScaleConversion(12),
    marginRight: horizontalScaleConversion(8),
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  tabActive: { backgroundColor: '#2b6ebf' },
  tabText: { color: '#bbb' },
  tabActiveText: { color: 'white' },
});
