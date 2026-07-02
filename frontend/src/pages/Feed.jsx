import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Feed() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    fetch(`${API}/social/feed`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    const res = await fetch(`${API}/social/posts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: newPost })
    });
    if (res.ok) { setNewPost(''); loadFeed(); }
    else { const d = await res.json(); alert(d.error || 'Post blocked'); }
  };

  const loadFeed = () => {
    fetch(`${API}/social/feed`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  };

  const handleLike = async (postId) => {
    await fetch(`${API}/social/posts/${postId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    loadFeed();
  };

  const toggleComments = async (postId) => {
    if (showComments[postId]) { setShowComments({ ...showComments, [postId]: false }); return; }
    const res = await fetch(`${API}/social/posts/${postId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setComments({ ...comments, [postId]: data.comments || [] });
    setShowComments({ ...showComments, [postId]: true });
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    const res = await fetch(`${API}/social/posts/${postId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content })
    });
    if (res.ok) { setCommentInputs({ ...commentInputs, [postId]: '' }); toggleComments(postId); loadFeed(); }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="card"><div className="card-header">👋 Hey {user?.name?.split(' ')[0]}!</div>
          <p style={{ fontSize: 14, color: '#888' }}>Share what you're learning, building, or curious about. Your network wants to hear from you!</p>
        </div>
        <div className="card"><div className="card-header">🏷️ Trending</div>
          {['#STEM', '#CollegePrep', '#MicroInternships', '#Scholarships', '#Coding', '#Portfolio'].map(tag => (
            <span key={tag} className="badge badge-purple" style={{ margin: '3px', cursor: 'pointer' }}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="main-content">
        <div className="feed-card">
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="post-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <textarea className="input textarea" style={{ minHeight: 80, background: '#12122a' }} placeholder="Share an achievement, question, or resource..." value={newPost} onChange={e => setNewPost(e.target.value)} />
              <div className="flex-between mt-8"><span style={{ fontSize: 12, color: '#666' }}>+5 XP for posting</span><button className="btn btn-primary btn-small" onClick={handlePost}>Post</button></div>
            </div>
          </div>
        </div>
        {posts.map(post => (
          <div key={post.id} className="feed-card">
            <div className="post-header">
              <div className="post-avatar">{post.name?.charAt(0)?.toUpperCase()}</div>
              <div><div className="post-author">{post.name}</div><div className="post-time">{new Date(post.created_at).toLocaleDateString()} · {post.type} · +10 XP</div></div>
            </div>
            <div className="post-content">{post.content}</div>
            <div className="post-actions">
              <button onClick={() => handleLike(post.id)}>👍 {post.likes_count || 0}</button>
              <button onClick={() => toggleComments(post.id)}>💬 {post.comments_count || 0}</button>
            </div>
            {showComments[post.id] && (
              <div style={{ marginTop: 12, borderTop: '1px solid #2a2a4a', paddingTop: 12 }}>
                {(comments[post.id] || []).map(c => <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14 }}><strong>{c.name}:</strong> {c.content}</div>)}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><input className="input" style={{ flex: 1, background: '#12122a' }} placeholder="Write a comment..." value={commentInputs[post.id] || ''} onChange={e => setCommentInputs({...commentInputs, [post.id]: e.target.value})} />
                <button className="btn btn-primary btn-small" onClick={() => handleComment(post.id)}>Send</button></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
