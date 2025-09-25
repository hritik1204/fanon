import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { horizontalScaleConversion } from '@/src/utils';

interface BatchActionFooterProps {
  isVisible: boolean;
  isAdmin: boolean;
  onBatchDelete: () => void;
  onBatchRecover: () => void;
}

export const BatchActionFooter: React.FC<BatchActionFooterProps> = ({
  isVisible,
  isAdmin,
  onBatchDelete,
  onBatchRecover,
}) => {
  if (!isVisible || !isAdmin) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 8,
        alignItems: 'center',
      }}
    >
      <TouchableOpacity
        onPress={onBatchDelete}
        style={[styles.adminBtn, { backgroundColor: '#8b2b2b' }]}
      >
        <Text style={{ color: 'white' }}>Delete Selected</Text>
      </TouchableOpacity>
      <View style={{ width: horizontalScaleConversion(8) }} />
      <TouchableOpacity onPress={onBatchRecover} style={[styles.adminBtn]}>
        <Text style={{ color: 'white' }}>Recover Selected</Text>
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
