import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';

let tempSeq = 0;
const nextTempId = () => `tmp-${Date.now()}-${tempSeq++}`;

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { connected, on, off, emit } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'join' | null

  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;

  // ---- HTTP: load my conversations ----
  const loadChats = useCallback(async () => {
    try {
      const payload = await api.myChats();
      setConversations(payload?.conversations || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // ---- Open a chat: subscribe via socket + fetch history via HTTP ----
  const openChat = useCallback(
    async (id) => {
      if (activeIdRef.current && activeIdRef.current !== id) {
        emit('leave_room', activeIdRef.current);
      }
      setActiveId(id);
      setMessages([]);
      setError('');
      emit('join_room', id); // Socket.IO -> server joins conversation:<id>
      try {
        const payload = await api.messages(id); // HTTP history
        setMessages(payload?.messages || []);
      } catch (err) {
        setError(err.message);
      }
    },
    [emit]
  );

  // ---- Socket: live messages + join/create notifications ----
  useEffect(() => {
    const handleNewMessage = (data) => {
      if (!data || data.chatId !== activeIdRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          id: nextTempId(),
          type: 'text',
          content: data.message,
          senderName: data.from,
          senderId: null, // socket payload has no id -> treat as incoming
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    const handleNotification = (data) => {
      if (!data || data.chatId !== activeIdRef.current) return;
      setMessages((prev) => [
        ...prev,
        { id: nextTempId(), system: true, content: data.message, createdAt: new Date().toISOString() },
      ]);
      if (data.action === 'create new chat' || data.action === 'Join') loadChats();
    };

    on('send_message', handleNewMessage);
    on('new_notification', handleNotification);
    return () => {
      off('send_message', handleNewMessage);
      off('new_notification', handleNotification);
    };
  }, [on, off, loadChats]);

  // ---- Send message over HTTP; server broadcasts to the socket room ----
  const handleSend = async (content) => {
    if (!activeId) return;
    try {
      await api.sendMessage({ conversationId: activeId, type: 'text', content });
      // No optimistic append: the sender's own socket receives 'send_message' back.
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await api.deleteMessage({ conversationId: activeId, messageId });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err.message);
    }
  };

  const messagesWithDelete = useMemo(
    () => messages.map((m) => ({ ...m, onDelete: handleDelete })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, activeId]
  );

  const createChat = async ({ name, type }) => {
    try {
      await api.createChat({ conversation_name: name, conversation_type: type });
      setModal(null);
      setError('');
      await loadChats();
    } catch (err) {
      setError(err.message);
    }
  };

  const joinChat = async (id) => {
    try {
      await api.joinChat(id);
      setModal(null);
      setError('');
      await loadChats();
      openChat(Number(id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={openChat}
        onNewChat={() => setModal('create')}
        onJoinChat={() => setModal('join')}
        onLogout={logout}
        username={user?.username}
      />

      <main className="chat-area">
        <div className="chat-header">
          <span>
            {activeId
              ? conversations.find((c) => c.id === activeId)?.name || `Chat #${activeId}`
              : 'Nexora'}
          </span>
          <span className={connected ? 'dot on' : 'dot off'}>
            {connected ? 'trực tuyến' : 'đang kết nối...'}
          </span>
        </div>

        {error && (
          <div className="alert error banner">
            {error}{' '}
            <button className="link" onClick={() => setError('')}>
              đóng
            </button>
          </div>
        )}

        <MessageList messages={messagesWithDelete} currentUserId={user?.userId} />
        <Composer disabled={!activeId} onSend={handleSend} />
      </main>

      {modal === 'create' && <CreateChatModal onClose={() => setModal(null)} onSubmit={createChat} />}
      {modal === 'join' && <JoinChatModal onClose={() => setModal(null)} onSubmit={joinChat} />}
    </div>
  );
}

function CreateChatModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('group');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Tạo đoạn chat mới</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSubmit({ name: name.trim(), type });
          }}
        >
          <label>
            Tên
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          <label>
            Loại
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="group">group</option>
              <option value="direct">direct</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="primary">
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinChatModal({ onClose, onSubmit }) {
  const [id, setId] = useState('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Vào đoạn chat</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (id.trim()) onSubmit(id.trim());
          }}
        >
          <label>
            ID đoạn chat
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              inputMode="numeric"
              placeholder="vd: 1"
              required
              autoFocus
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="primary">
              Tham gia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
