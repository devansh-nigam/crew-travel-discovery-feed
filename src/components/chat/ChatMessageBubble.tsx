import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/fonts';
import { TypingIndicator } from './TypingIndicator';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isPending?: boolean;
};

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.isPending ? (
          <TypingIndicator />
        ) : (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#904D4E',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#34272B',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#F5EDEA',
  },
  textAssistant: {
    color: '#E5D5D5',
  },
});
