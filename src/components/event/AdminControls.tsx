import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { horizontalScaleConversion } from '@/src/utils';

interface AdminControlsProps {
  isAdmin: boolean;
  isGuest: boolean;
  event: any;
  selectionMode: boolean;
  onStartEvent: () => void;
  onEndEvent: () => void;
  onTogglePause: () => void;
  onToggleSelection: () => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({
  isAdmin,
  isGuest,
  event,
  selectionMode,
  onStartEvent,
  onEndEvent,
  onTogglePause,
  onToggleSelection,
}) => {
  if (!isAdmin && !isGuest) return null;

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        rowGap: horizontalScaleConversion(12),
      }}
    >
      <TouchableOpacity onPress={onStartEvent} style={[styles.adminBtn]}>
        <Text style={{ color: 'white' }}>Start Event</Text>
      </TouchableOpacity>
      <View style={{ width: horizontalScaleConversion(8) }} />
      <TouchableOpacity onPress={onEndEvent} style={[styles.adminBtn]}>
        <Text style={{ color: 'white' }}>End Event</Text>
      </TouchableOpacity>
      <View style={{ width: horizontalScaleConversion(8) }} />
      <TouchableOpacity
        onPress={onTogglePause}
        style={[
          styles.adminBtn,
          {
            backgroundColor: event?.submissionsPaused ? '#8b2b2b' : '#444',
          },
        ]}
      >
        <Text style={{ color: 'white' }}>
          {event?.submissionsPaused ? 'Resume Submissions' : 'Pause Submissions'}
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={onToggleSelection}
        style={[
          styles.adminBtn,
          { backgroundColor: selectionMode ? '#2b6ebf' : '#444' },
        ]}
      >
        <Text style={{ color: 'white' }}>
          {selectionMode ? 'Exit Select' : 'Select'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  adminBtn: {
    backgroundColor: '#444',
    paddingHorizontal: horizontalScaleConversion(12),
    paddingVertical: horizontalScaleConversion(8),
    borderRadius: 8,
    marginRight: horizontalScaleConversion(6),
  },
});
