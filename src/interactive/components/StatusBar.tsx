// StatusBar — shows model, provider, token info at bottom
import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  model: string;
  provider: string;
  tokenCount: number;
  isStreaming: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ model, provider, tokenCount, isStreaming }) => {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Text>
        <Text color="magenta" bold>{provider}</Text>
        <Text dimColor> / </Text>
        <Text color="cyan">{model}</Text>
      </Text>
      <Text>
        {isStreaming && <Text color="yellow">● streaming </Text>}
        <Text dimColor>{tokenCount > 0 ? `~${tokenCount} tokens` : ''}</Text>
        <Text dimColor>  /model to switch  /help for commands</Text>
      </Text>
    </Box>
  );
};
