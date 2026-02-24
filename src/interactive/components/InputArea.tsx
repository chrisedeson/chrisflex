// InputArea — text input for the chat
import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSubmit, disabled }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useInput((ch, key) => {
    if (disabled) return;

    if (key.return) {
      const trimmed = input.trim();
      if (trimmed) {
        setHistory(prev => [trimmed, ...prev]);
        setHistoryIndex(-1);
        onSubmit(trimmed);
        setInput('');
      }
      return;
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      return;
    }

    // History navigation
    if (key.upArrow) {
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIdx = historyIndex + 1;
        setHistoryIndex(newIdx);
        setInput(history[newIdx] ?? '');
      }
      return;
    }

    if (key.downArrow) {
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(history[newIdx] ?? '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
      return;
    }

    // Ctrl+C handled by Ink
    if (key.ctrl && ch === 'c') return;
    // Ctrl+U — clear input
    if (key.ctrl && ch === 'u') {
      setInput('');
      return;
    }

    // Regular character
    if (ch && !key.ctrl && !key.meta) {
      setInput(prev => prev + ch);
    }
  });

  return (
    <Box paddingX={1}>
      <Text color="magenta" bold>❯ </Text>
      {disabled ? (
        <Text dimColor>waiting for response...</Text>
      ) : (
        <Text>
          {input}
          <Text color="magenta">▌</Text>
        </Text>
      )}
    </Box>
  );
};
