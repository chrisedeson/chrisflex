// Welcome banner for interactive mode
import React from 'react';
import { Box, Text } from 'ink';

export const Welcome: React.FC<{ providers: string[] }> = ({ providers }) => {
  return (
    <Box flexDirection="column" paddingX={1} marginBottom={1}>
      <Text color="magenta" bold>
        {'  '}chrisflex interactive
      </Text>
      <Text dimColor>
        {'  '}Lean AI workflow manager with persistent memory
      </Text>
      <Box marginTop={1}>
        <Text dimColor>{'  '}Providers: </Text>
        {providers.length > 0 ? (
          providers.map((p, i) => (
            <Text key={p}>
              <Text color="green">{p}</Text>
              {i < providers.length - 1 && <Text dimColor>, </Text>}
            </Text>
          ))
        ) : (
          <Text color="red">none — run chrisflex auth to connect a provider</Text>
        )}
      </Box>
      <Text dimColor>
        {'  '}Type a message or use /help for commands. Ctrl+C to exit.
      </Text>
    </Box>
  );
};
