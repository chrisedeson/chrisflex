// App — main interactive REPL component
// Wires together: Welcome, MessageList, InputArea, StatusBar
// Manages chat state, streaming, slash commands, model switching

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import { Welcome } from './components/Welcome.js';
import { MessageList } from './components/MessageList.js';
import { InputArea } from './components/InputArea.js';
import { StatusBar } from './components/StatusBar.js';
import { getReadyProviders, getDefaultModel, getProviderForModel, getAvailableModels } from './providers/registry.js';
import type { Message, AIProvider, ModelInfo } from './providers/types.js';

export const App: React.FC = () => {
  const { exit } = useApp();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize — detect providers, pick default model
  useEffect(() => {
    (async () => {
      try {
        const ready = await getReadyProviders();
        const providerNames = ready.map(p => p.info.id);
        setProviders(providerNames);

        const def = await getDefaultModel();
        if (def) {
          setCurrentModel(def.model);
          setCurrentProvider(def.provider);
        }
      } catch {
        // Silently handle — Welcome will show "no providers"
      }
      setInitialized(true);
    })();
  }, []);

  // Build system prompt with .chrisflex memory context
  const getSystemPrompt = useCallback((): string => {
    return [
      'You are chrisflex, a lean AI coding assistant.',
      'Be concise. Avoid unnecessary preamble.',
      'When asked about code, give direct answers with code examples.',
      'For simple questions, keep responses short (1-3 paragraphs).',
      'For complex tasks, be thorough but structured.',
    ].join('\n');
  }, []);

  // Handle slash commands
  const handleSlashCommand = useCallback(async (input: string) => {
    const parts = input.slice(1).split(/\s+/);
    const cmd = parts[0]?.toLowerCase();

    switch (cmd) {
      case 'help': {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: [
            '╭─── chrisflex commands ───╮',
            '│ /help       Show this    │',
            '│ /model      Switch model │',
            '│ /models     List models  │',
            '│ /clear      Clear chat   │',
            '│ /exit       Quit         │',
            '╰──────────────────────────╯',
          ].join('\n'),
        }]);
        break;
      }

      case 'model': {
        const modelId = parts[1];
        if (!modelId) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Current model: ${currentModel?.name ?? 'none'}\nUsage: /model <model-id>\nRun /models to see available models.`,
          }]);
          break;
        }
        const provider = getProviderForModel(modelId);
        if (!provider) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Unknown model: ${modelId}\nRun /models to see available models.`,
          }]);
          break;
        }
        const model = provider.info.models.find(m => m.id === modelId);
        if (model) {
          setCurrentModel(model);
          setCurrentProvider(provider);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Switched to ${model.name} (${provider.info.name})`,
          }]);
        }
        break;
      }

      case 'models': {
        try {
          const models = await getAvailableModels();
          if (models.length === 0) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'No models available. Run `chrisflex auth <provider>` to connect.',
            }]);
          } else {
            const lines = models.map(m => {
              const active = m.id === currentModel?.id ? ' ← active' : '';
              const tier = m.costTier === 'free' ? '🆓' : m.costTier === 'cheap' ? '💰' : m.costTier === 'standard' ? '💰💰' : '💰💰💰';
              return `  ${tier} ${m.id} (${m.provider})${active}`;
            });
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Available models:\n${lines.join('\n')}\n\nSwitch: /model <model-id>`,
            }]);
          }
        } catch {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Failed to list models.',
          }]);
        }
        break;
      }

      case 'clear': {
        setMessages([]);
        setStreamingText('');
        setTokenCount(0);
        setStatusMessage('Chat cleared');
        break;
      }

      case 'exit':
      case 'quit':
      case 'q': {
        exit();
        break;
      }

      default: {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Unknown command: /${cmd}\nType /help for available commands.`,
        }]);
      }
    }
  }, [currentModel, exit]);

  // Send message to AI and stream response
  const handleSend = useCallback(async (input: string) => {
    // Slash commands
    if (input.startsWith('/')) {
      await handleSlashCommand(input);
      return;
    }

    if (!currentProvider || !currentModel) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No AI provider connected. Run `chrisflex auth <provider>` first.\nSupported: github, anthropic, openai',
      }]);
      return;
    }

    // Add user message
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    // Start streaming
    setIsStreaming(true);
    setStreamingText('');

    try {
      const allMessages = [...messages, userMsg];
      let fullResponse = '';

      const stream = currentProvider.stream({
        model: currentModel.id,
        messages: allMessages,
        systemPrompt: getSystemPrompt(),
        maxTokens: 4096,
        temperature: 0.7,
      });

      for await (const event of stream) {
        switch (event.type) {
          case 'text':
            fullResponse += event.content;
            setStreamingText(fullResponse);
            break;
          case 'error':
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Error: ${event.content}`,
            }]);
            setIsStreaming(false);
            setStreamingText('');
            return;
          case 'done':
            break;
        }
      }

      // Stream complete — move to messages
      const assistantMsg: Message = {
        role: 'assistant',
        content: fullResponse,
        model: currentModel.name,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Rough token estimate (4 chars ≈ 1 token)
      const allText = allMessages.map(m => m.content).join('') + fullResponse;
      setTokenCount(Math.round(allText.length / 4));
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Stream error: ${err instanceof Error ? err.message : String(err)}`,
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [currentProvider, currentModel, messages, handleSlashCommand, getSystemPrompt]);

  if (!initialized) {
    return (
      <Box paddingX={1}>
        <Text color="magenta">⏳ Connecting to providers...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" minHeight={10}>
      <Welcome providers={providers} />
      <MessageList messages={messages} streamingText={streamingText} isStreaming={isStreaming} />
      <InputArea onSubmit={handleSend} disabled={isStreaming} />
      <StatusBar
        model={currentModel?.name ?? 'none'}
        provider={currentProvider?.info.name ?? 'none'}
        tokenCount={tokenCount}
        isStreaming={isStreaming}
      />
    </Box>
  );
};
