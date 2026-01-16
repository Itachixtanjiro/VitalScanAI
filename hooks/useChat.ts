
import { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult } from '../types';
import { createHealthChatSession } from '../geminiService';

export const useChat = (initialMessage: string) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<any>(null);

  const initChat = (analysis: AnalysisResult) => {
    chatSessionRef.current = createHealthChatSession(analysis);
    setChatMessages([{ role: 'model', text: initialMessage }]);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !chatSessionRef.current) return;

    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setIsTyping(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message });
      let fullText = '';
      setChatMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of resultStream) {
        fullText += chunk.text;
        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullText;
          return newMsgs;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return { isChatOpen, setIsChatOpen, chatMessages, isTyping, initChat, sendMessage };
};
