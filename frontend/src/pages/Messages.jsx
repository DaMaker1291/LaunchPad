import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Messages() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setConversations(d.conversations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetch(`${API}/messages/${selectedUser}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
      fetch(`${API}/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setConversations(d.conversations || [])).catch(() => {});
    }
  }, [selectedUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedUser) return;
    const res = await fetch(`${API}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receiver_id: selectedUser, content: newMsg })
    });
    if (res.ok) {
      setMessages([...messages, { id: Date.now().toString(), content: newMsg, sender_id: user.id, receiver_id: selectedUser, created_at: new Date().toISOString() }]);
      setNewMsg('');
    } else {
      const data = await res.json();
      alert(data.error || 'Message blocked by safety filter');
    }
  };

  const filtered = conversations.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>
      <div className="chat-sidebar">
        <div style={{ padding: 16, borderBottom: '1px solid #2a2a4a' }}>
          <h3 style={{ marginBottom: 12 }}>💬 Messages</h3>
          <input className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chat-list">
          {filtered.map(c => <div key={c.other_user_id} className={`chat-item ${selectedUser === c.other_user_id ? 'active' : ''}`} onClick={() => setSelectedUser(c.other_user_id)}>
            <div className="chat-avatar">{c.name?.charAt(0)?.toUpperCase()}</div>
            <div className="chat-info"><div className="name">{c.name}</div><div className="last-msg">{c.last_message || 'No messages'}</div></div>
            {c.unread > 0 && <div className="unread-badge">{c.unread}</div>}
          </div>)}
        </div>
      </div>
      <div className="chat-main">
        {selectedUser ? <>
          <div className="chat-messages">
            {messages.map(m => <div key={m.id} className={`msg ${m.sender_id === user.id ? 'sent' : 'received'}`}>
              {m.content}<span className="time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>)}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area"><input className="input" placeholder="Type a message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} /><button className="btn btn-primary" onClick={handleSend}>Send</button></div>
        </> : <div className="empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div><div className="icon" style={{ fontSize: 64, marginBottom: 16 }}>💬</div><h3>Select a conversation</h3><p style={{ color: '#666' }}>Messaging is monitored for safety.</p></div>
        </div>}
      </div>
    </div>
  );
}
