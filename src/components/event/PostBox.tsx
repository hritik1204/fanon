import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { horizontalScaleConversion } from '@/src/utils';
import { Colors } from '@/src/constants/theme';

interface PostBoxProps {
  text: string;
  posting: boolean;
  eventState: string;
  submissionsPaused: boolean;
  onTextChange: (text: string) => void;
  onPost: () => void;
}

export const PostBox: React.FC<PostBoxProps> = ({
  text,
  posting,
  eventState,
  submissionsPaused,
  onTextChange,
  onPost,
}) => {
  return (
    <View style={styles.postBox}>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder={
          eventState === 'live' ? 'Ask a question...' : 'Questions are closed'
        }
        placeholderTextColor="#777"
        style={[
          styles.input,
          eventState !== 'live' || submissionsPaused ? { opacity: 0.6 } : null,
        ]}
        editable={eventState === 'live' && !submissionsPaused}
      />
      <TouchableOpacity
        onPress={onPost}
        style={[
          styles.postBtn,
          {
            backgroundColor:
              eventState === 'live' && !submissionsPaused
                ? Colors.light.background
                : '#666',
          },
        ]}
        disabled={posting || eventState !== 'live' || submissionsPaused}
      >
        <Text
          style={{
            color: eventState === 'live' ? '#000' : 'white',
            fontWeight: '700',
          }}
        >
          {posting ? 'Posting...' : 'Post'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  postBox: {
    flexDirection: 'row',
    padding: horizontalScaleConversion(12),
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: horizontalScaleConversion(1),
    borderColor: '#333',
    padding: horizontalScaleConversion(8),
    color: 'white',
    borderRadius: 6,
    marginRight: horizontalScaleConversion(8),
  },
  postBtn: {
    paddingHorizontal: horizontalScaleConversion(14),
    paddingVertical: horizontalScaleConversion(10),
    borderRadius: 6,
  },
});
