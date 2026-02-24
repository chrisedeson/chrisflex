// MessageList — renders chat history using Ink's Static for completed messages
import React from 'react';
import { Box, Text, Static } from 'ink';
import type { Message } from '../providers/types.js';

interface MessageListProps {
  messages: Message[];
  streamingText: string;
  isStreaming: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, streamingText, isStreaming }) => {
  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Completed messages — rendered once, scroll up */}
      <Static items={messages.map((m, i) => ({ ...m, key: i }))}>
        {(msg) => (
          <Box key={msg.key} flexDirection="column" marginBottom={1} paddingX={1}>
            <Text bold color={msg.role === 'user' ? 'blue' : 'green'}>
              {msg.role === 'user' ? '❯ You' : '◆ Assistant'}
              {msg.model && <Text dimColor>{' '}({msg.model})</Text>}
            </Text>
            <Box paddingLeft={2}>
              <Text wrap="wrap">{msg.content}</Text>
            </Box>
          </Box>
        )}
      </Static>

      {/* Currently streaming response */}
      {isStreaming && (
        <Box flexDirection="column" marginBottom={1} paddingX={1}>
          <Text bold color="green">
            ◆ Assistant
          </Text>
          <Box paddingLeft={2}>
            <Text wrap="wrap" color="white">
              {streamingText || '▌'}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
