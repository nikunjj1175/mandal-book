import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import api from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';
import { useGetMembersQuery } from '@/store/api/membersApi';
import { formatDistanceToNow } from 'date-fns';

const POLL_INTERVAL = 2500;

function MessageBubble({ msg, isOwn, onEdit, onDelete, t }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.message);
  const [showMenu, setShowMenu] = useState(false);
  const sender = msg.userId;
  const name = sender?.name || 'Unknown';
  const role = sender?.role || 'member';
  const initial = (name || 'U').slice(0, 1).toUpperCase();
  const trans = t || ((k) => k);

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== msg.message) {
      onEdit(msg._id, trimmed);
    }
    setEditing(false);
    setEditText(msg.message);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(msg.message);
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} group`}>
      <div
        className={`flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full items-center justify-center text-sm font-bold ${
          isOwn ? 'bg-blue-600 text-white' : role === 'admin' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200'
        }`}
      >
        {initial}
      </div>
      <div className={`flex min-w-0 max-w-[85%] sm:max-w-[75%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2">
          <span className={`text-xs font-semibold ${role === 'admin' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {name}
            {role === 'admin' && (
              <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Admin</span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
            {msg.editedAt && ' • ' + (trans('chat.edited') || 'edited')}
          </span>
          {isOwn && !editing && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500"
                aria-label="Options"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-6 z-20 mt-1 w-28 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                    <button onClick={() => { setShowMenu(false); setEditing(true); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                      {trans('chat.edit') || 'Edit'}
                    </button>
                    <button onClick={() => { setShowMenu(false); onDelete(msg._id); }} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      {trans('chat.delete') || 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {editing ? (
          <div className="mt-0.5 w-full rounded-2xl border-2 border-blue-500 bg-white dark:bg-slate-800 p-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              maxLength={2000}
              autoFocus
            />
            <div className="mt-2 flex gap-2 justify-end">
              <button onClick={handleCancelEdit} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                {trans('chat.cancel') || 'Cancel'}
              </button>
              <button onClick={handleSaveEdit} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                {trans('chat.save') || 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`mt-0.5 rounded-2xl px-3 py-2 text-sm ${
              isOwn ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
            }`}
          >
            <p className="break-words whitespace-pre-wrap">{msg.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatBox({ t, embedded = false, onClose }) {
  const { user } = useAuth();
  const { chatMode, chatWithUser, openChat } = useChat();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(chatMode);
  const [selectedUser, setSelectedUser] = useState(chatWithUser);
  const scrollRef = useRef(null);
  const [lastNotifiedAt, setLastNotifiedAt] = useState(null);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  const { data: membersData } = useGetMembersQuery(undefined, { skip: !user });
  const members = (membersData?.data?.members || []).filter(
    (m) => String(m._id || m.id) !== String(user?._id)
  );
  const isPersonal = activeTab === 'personal' && selectedUser;
  const recipientId = selectedUser?._id || selectedUser?.id;
  const queryParams = isPersonal ? { mode: 'personal', with: recipientId } : { mode: 'group' };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/api/chat/messages', { params: queryParams });
      if (res.data.success) {
        setMessages(res.data.data.messages || []);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load messages');
      if (err.response?.status === 403) setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTyping = async () => {
    try {
      const params = isPersonal && recipientId
        ? { mode: 'personal', with: recipientId }
        : { mode: 'group' };
      const res = await api.get('/api/chat/typing', { params });
      if (res.data.success) {
        setTypingUsers(res.data.data?.typingUsers || []);
      }
    } catch {
      // ignore typing errors; non-critical
    }
  };

  useEffect(() => {
    setActiveTab(chatMode);
    setSelectedUser(chatWithUser);
    // Reset notification baseline when switching chat context
    setNotificationsReady(false);
    setLastNotifiedAt(null);
  }, [chatMode, chatWithUser]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    const msgInterval = setInterval(fetchMessages, POLL_INTERVAL);
    const typingInterval = setInterval(fetchTyping, POLL_INTERVAL);
    return () => {
      clearInterval(msgInterval);
      clearInterval(typingInterval);
    };
  }, [activeTab, recipientId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Initialize baseline so old history messages don't trigger toasts
  useEffect(() => {
    if (!notificationsReady && !loading && messages.length) {
      const latest = messages[messages.length - 1];
      if (latest?.createdAt) {
        setLastNotifiedAt(new Date(latest.createdAt));
      }
      setNotificationsReady(true);
    } else if (!notificationsReady && !loading && !messages.length) {
      setNotificationsReady(true);
    }
  }, [notificationsReady, loading, messages]);

  // Show toast for new incoming messages (from others)
  useEffect(() => {
    if (!notificationsReady || !user || !messages.length) return;
    const baseline = lastNotifiedAt ? lastNotifiedAt.getTime() : 0;
    const incoming = messages.filter((m) => {
      if (!m.userId || !m.createdAt) return false;
      const isOwn = String(m.userId._id) === String(user._id || user.id);
      if (isOwn) return false;
      const ts = new Date(m.createdAt).getTime();
      return ts > baseline;
    });
    if (!incoming.length) return;

    // Tell widget there are new messages (for badge)
    try {
      window.dispatchEvent(
        new CustomEvent('chat:newMessages', {
          detail: { count: incoming.length },
        })
      );
    } catch (e) {
      // ignore if window not available
    }

    // Single compact toast summarizing all new messages
    const newest = incoming[incoming.length - 1];
    const lastSender = newest.userId?.name || 'Member';
    const preview = newest.message.length > 80 ? newest.message.slice(0, 80) + '…' : newest.message;
    const countLabel =
      incoming.length === 1
        ? `New message from ${lastSender}`
        : `${incoming.length} new messages (last from ${lastSender})`;

    toast.custom(
      (toastInstance) => (
        <div
          className={`flex w-full max-w-sm items-start gap-3 rounded-xl border border-blue-100 bg-white shadow-lg px-3 py-2.5 ${
            toastInstance.visible ? 'animate-slide-in' : 'animate-leave'
          }`}
        >
          <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
            {(lastSender || 'M').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 mb-0.5">
              {countLabel}
            </p>
            <p className="text-xs text-slate-600 line-clamp-2">
              {preview}
            </p>
          </div>
        </div>
      ),
      { duration: 4000 }
    );

    if (newest?.createdAt) {
      setLastNotifiedAt(new Date(newest.createdAt));
    }
  }, [notificationsReady, messages, user, lastNotifiedAt]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');
    setError('');

    try {
      const body = { message: text };
      if (isPersonal) body.recipientId = recipientId;
      const res = await api.post('/api/chat/messages', body);
      if (res.data.success && res.data.data?.message) {
        setMessages((prev) => [...prev, res.data.data.message]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const sendTyping = async (isTyping) => {
    try {
      await api.post('/api/chat/typing', {
        mode: isPersonal ? 'personal' : 'group',
        recipientId: isPersonal ? recipientId : undefined,
        isTyping,
      });
    } catch {
      // ignore
    }
  };

  const handleEditMessage = async (msgId, newText) => {
    try {
      const res = await api.patch(`/api/chat/messages/${msgId}`, { message: newText });
      if (res.data.success && res.data.data?.message) {
        setMessages((prev) => prev.map((m) => (m._id === msgId ? res.data.data.message : m)));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm(trans('chat.deleteConfirm') || 'Delete this message?')) return;
    try {
      await api.delete(`/api/chat/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const startChatWith = (member) => {
    const id = member._id || member.id;
    setSelectedUser({ _id: id, name: member.name });
    setActiveTab('personal');
    openChat('personal', { _id: member._id || member.id, name: member.name });
  };

  if (!user) return null;

  const trans = t || ((k) => k);
  const chatTitle = isPersonal ? trans('chat.with') + ' ' + (selectedUser?.name || '') : trans('chat.title');
  const chatSubtitle = isPersonal ? trans('chat.personalChat') : trans('chat.subtitle');
  const placeholder = trans('chat.placeholder');
  const sendLabel = trans('chat.send');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{chatTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{chatSubtitle}</p>
          </div>
        </div>
        {embedded && onClose && (
          <button onClick={onClose} className="flex-shrink-0 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close">
            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs: Group | Personal */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={() => { setActiveTab('group'); setSelectedUser(null); }}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'group' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {trans('chat.group')}
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'personal' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {trans('chat.personal')}
        </button>
      </div>

      {/* Personal: Member selector */}
      {activeTab === 'personal' && !selectedUser && (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{trans('chat.selectMember')}</p>
          <div className="space-y-2">
            {members.map((m) => (
              <button
                key={m._id || m.id}
                onClick={() => startChatWith(m)}
                className="w-full flex items-center gap-3 rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  {(m.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{m.name}</span>
              </button>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{trans('chat.noMembers')}</p>
            )}
          </div>
        </div>
      )}

      {/* Messages + typing indicator + Input (when group or personal with selected user) */}
      {(activeTab === 'group' || selectedUser) && (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30"
          >
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : error && messages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <p className="text-sm font-medium">{trans('chat.noMessages')}</p>
                <p className="text-xs mt-1">{trans('chat.startChat')}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  msg={msg}
                  isOwn={String(msg.userId?._id) === String(user._id || user.id)}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  t={trans}
                />
              ))
            )}
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 pb-1 text-xs text-slate-500 dark:text-slate-400">
              {isPersonal
                ? `${typingUsers[0].name || 'Member'} is typing…`
                : typingUsers.length === 1
                  ? `${typingUsers[0].name || 'Member'} is typing…`
                  : `${typingUsers[0].name || 'Member'} and ${typingUsers.length - 1} others are typing…`}
            </div>
          )}

          {error && messages.length > 0 && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">{error}</div>
          )}

          <form onSubmit={handleSend} className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  const val = e.target.value;
                  setInput(val);

                  // Typing indicator
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  sendTyping(true);
                  typingTimeoutRef.current = setTimeout(() => {
                    sendTyping(false);
                  }, 2000);
                }}
                placeholder={placeholder}
                maxLength={2000}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {sendLabel}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{input.length}/2000</p>
          </form>
        </>
      )}
    </div>
  );
}
