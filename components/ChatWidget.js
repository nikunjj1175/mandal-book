import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import ChatBox from './ChatBox';
import { useTranslation } from '@/lib/useTranslation';
import { useGetNotificationsQuery } from '@/store/api/notificationsApi';

export default function ChatWidget() {
  const { user } = useAuth();
  const { chatOpen, toggleChat, openChat } = useChat();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { mode = 'group', withUser } = e.detail || {};
      openChat(mode, withUser);
    };
    window.addEventListener('openChat', handler);
    return () => window.removeEventListener('openChat', handler);
  }, [openChat]);

  // Badge count from chat messages (not notifications)
  useEffect(() => {
    const handler = (e) => {
      const { count = 1 } = e.detail || {};
      if (chatOpen) return; // if already open, don't increment badge
      setNewCount((prev) => Math.min(prev + count, 99));
    };
    window.addEventListener('chat:newMessages', handler);
    return () => window.removeEventListener('chat:newMessages', handler);
  }, [chatOpen]);

  // Clear badge when opening chat
  useEffect(() => {
    if (chatOpen) {
      setNewCount(0);
    }
  }, [chatOpen]);

  if (!user) return null;

  if (user.role !== 'admin' && (user.adminApprovalStatus !== 'approved' || user.isActive === false)) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button - bottom right, chatbot style */}
      {mounted && (
        <div className="fixed bottom-6 right-6 z-[9990]">
          <button
            style={{ position: 'relative' }}
            onClick={toggleChat}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/40 hover:shadow-xl hover:scale-105 transition-all"
            aria-label={t('chat.title') || 'Chat'}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {newCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.5rem] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md animate-bounce">
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Panel - Slide up overlay */}
      {chatOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && toggleChat()}>
          <div
            className="ml-auto mt-auto h-[85vh] w-full max-w-lg rounded-t-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col animate-slide-up-chat"
            onClick={(e) => e.stopPropagation()}
          >
            <ChatBox t={t} embedded onClose={toggleChat} />
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes slide-up-chat {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up-chat {
          animation: slide-up-chat 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
