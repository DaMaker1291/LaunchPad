import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Rewards() {
  const { user, updateUser } = useAuth();
  const token = localStorage.getItem('token');
  const [wallet, setWallet] = useState({ coins: 0, rewards: [], coinTxns: [] });
  const [showRedeem, setShowRedeem] = useState(null);

  useEffect(() => {
    fetch(`${API}/freelance/wallet`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWallet(d)).catch(() => {});
  }, []);

  const redeem = async (rewardId) => {
    const res = await fetch(`${API}/freelance/wallet/redeem`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reward_id: rewardId })
    });
    if (res.ok) {
      const reward = wallet.rewards.find(r => r.id === rewardId);
      if (reward) {
        setWallet(prev => ({ ...prev, coins: prev.coins - reward.coin_cost }));
        updateUser({ coins: (user?.coins || 0) - reward.coin_cost });
      }
      setShowRedeem(null);
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div>
      <div className="profile-header mb-24">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 64 }}>🏆</div>
          <div>
            <h2>LaunchPad Rewards</h2>
            <p className="bio">Earn coins through quests, posts, and achievements. Redeem for awesome rewards!</p>
            <div className="mt-8">
              <span className="coin-display" style={{ fontSize: 28 }}>🪙 {wallet.coins} coins</span>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 16 }}>🎁 Available Rewards</h3>
      <div className="grid-3">
        {wallet.rewards?.map(r => (
          <div key={r.id} className={`card card-hover ${showRedeem === r.id ? 'card-accent' : ''}`}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{r.category === 'Education' ? '📚' : r.category === 'Career' ? '💼' : r.category === 'Productivity' ? '📋' : '🎮'}</div>
            <h4>{r.name}</h4>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{r.description}</p>
            <div className="flex-between mt-8">
              <span className="coin-display">🪙 {r.coin_cost}</span>
              <span className="badge badge-purple">{r.provider}</span>
            </div>
            {r.stock <= 5 && r.stock > 0 && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>Only {r.stock} left!</p>}
            {showRedeem === r.id ? (
              <div className="flex-between mt-8" style={{ gap: 8 }}>
                <button className="btn btn-success btn-small" style={{ flex: 1 }} onClick={() => redeem(r.id)}>Confirm 🪙</button>
                <button className="btn btn-secondary btn-small" onClick={() => setShowRedeem(null)}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-small mt-8 btn-block" onClick={() => setShowRedeem(r.id)} disabled={wallet.coins < r.coin_cost || r.stock <= 0}>
                {wallet.coins < r.coin_cost ? 'Not enough coins' : 'Redeem'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-24">
        <div className="card-header">📜 Coin History</div>
        {wallet.coinTxns?.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2a4a', fontSize: 14 }}>
            <div>
              <span style={{ fontWeight: 600 }}>{t.source}</span>
              <p style={{ fontSize: 12, color: '#888' }}>{t.description}</p>
            </div>
            <span style={{ color: t.amount > 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
          </div>
        ))}
        {(!wallet.coinTxns || wallet.coinTxns.length === 0) && <p style={{ color: '#666' }}>No transactions yet. Complete quests to earn coins!</p>}
      </div>
    </div>
  );
}
