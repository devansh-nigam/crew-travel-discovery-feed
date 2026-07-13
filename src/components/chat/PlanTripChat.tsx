import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Fonts } from '@/constants/fonts';
import { ChatMessageBubble, type ChatMessage } from './ChatMessageBubble';
import { TypewriterPrompt } from './TypewriterPrompt';

let messageIdCounter = 0;
function nextMessageId() {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

const NOT_INTEGRATED_MESSAGE = 'Anthropic streaming is not integrated yet.';
const REPLY_DELAY_MS = 500;

type PlanTripChatProps = {
  onInputFocus?: () => void;
};

export function PlanTripChat({ onInputFocus }: PlanTripChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: ChatMessage = { id: nextMessageId(), role: 'user', content: text };
    const assistantId = nextMessageId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isPending: true,
    };

    setMessages((current) => [...current, userMessage, assistantPlaceholder]);
    setDraft('');
    requestAnimationFrame(scrollToEnd);

    setTimeout(() => {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: NOT_INTEGRATED_MESSAGE, isPending: false }
            : message,
        ),
      );
      requestAnimationFrame(scrollToEnd);
    }, REPLY_DELAY_MS);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={[
          styles.messageListContent,
          messages.length === 0 && styles.messageListContentEmpty,
        ]}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <TypewriterPrompt />
        ) : (
          messages.map((message) => <ChatMessageBubble key={message.id} message={message} />)
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onFocus={onInputFocus}
          placeholder="Message"
          placeholderTextColor="#867677"
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            !draft.trim() && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed,
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    gap: 10,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  messageListContentEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 18,
    backgroundColor: '#34272B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#E5D5D5',
  },
  sendButton: {
    borderRadius: 18,
    backgroundColor: '#904D4E',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: '#F5EDEA',
  },
});
