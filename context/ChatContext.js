import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState('group'); // 'group' | 'personal'
  const [chatWithUser, setChatWithUser] = useState(null); // { _id, name } for personal

  const openChat = (mode = 'group', withUser = null) => {
    setChatMode(mode);
    setChatWithUser(withUser);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatWithUser(null);
    setChatMode('group');
  };

  const toggleChat = () => {
    setChatOpen((prev) => !prev);
    if (!chatOpen) {
      setChatMode('group');
      setChatWithUser(null);
    }
  };

  return (
    <ChatContext.Provider value={{ chatOpen, chatMode, chatWithUser, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) return { chatOpen: false, openChat: () => {}, closeChat: () => {}, toggleChat: () => {} };
  return ctx;
}
