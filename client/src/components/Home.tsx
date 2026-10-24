import { useState } from 'react';
import { getSavedCosmetics, saveCosmetics } from '../cosmetics';
import CosmeticsModal from './CosmeticsModal';
import { playClickSound } from '../audio';

interface HomeProps {
  onCreateRoom: (name: string, avatar?: string, cardSkin?: string) => void;
  onJoinRoom: (roomCode: string, name: string, avatar?: string, cardSkin?: string) => void;
  error: string;
}

const QUICK_AVATARS = ['🦊', '🤖', '🐱', '🐼', '🦁', '🧙', '🥷', '👑'];

export default function Home({ onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [cosmetics, setCosmetics] = useState(() => getSavedCosmetics());
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      playClickSound();
      onCreateRoom(playerName.trim(), cosmetics.avatar, cosmetics.cardSkin);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      playClickSound();
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim(), cosmetics.avatar, cosmetics.cardSkin);
    }
  };

  const handleQuickAvatar = (av: string) => {
    playClickSound();
    const updated = saveCosmetics({ avatar: av });
    setCosmetics(updated);
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Top cosmetics shortcut */}
        <div className="home-top-bar">
          <button
            type="button"
            className="cosmetics-pill-btn"
            onClick={() => {
              playClickSound();
              setIsCosmeticsOpen(true);
            }}
          >
            🎨 Ngoại Trang & Themes
          </button>
        </div>

        <div className="logo-badge">🃏 3TLPJ</div>
        <h1 className="game-title">UNO Online Realtime</h1>
        <p className="game-subtitle">Chơi bài ma thuật cùng bạn bè mọi lúc mọi nơi!</p>

        {/* Selected Avatar Banner */}
        <div className="selected-avatar-banner">
          <span className="big-avatar">{cosmetics.avatar}</span>
          <div className="quick-avatars-row">
            {QUICK_AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                className={`quick-avatar-btn ${cosmetics.avatar === av ? 'active' : ''}`}
                onClick={() => handleQuickAvatar(av)}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {mode === 'choose' && (
          <div className="mode-choices">
            <button
              className="btn btn-primary mode-btn"
              onClick={() => {
                playClickSound();
                setMode('create');
              }}
            >
              👑 Tạo Phòng Mới (Create Room)
            </button>
            <button
              className="btn btn-secondary mode-btn"
              onClick={() => {
                playClickSound();
                setMode('join');
              }}
            >
              🚀 Vào Phòng Có Sẵn (Join Room)
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="form">
            <h2>Tạo Phòng Mới</h2>
            <div className="form-group">
              <label htmlFor="playerName">Tên hiển thị của bạn</label>
              <input
                id="playerName"
                type="text"
                className="input"
                placeholder="Nhập biệt danh của bạn..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  playClickSound();
                  setMode('choose');
                }}
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!playerName.trim()}
              >
                Tạo Phòng
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="form">
            <h2>Vào Phòng Chơi</h2>
            <div className="form-group">
              <label htmlFor="roomCode">Mã phòng (6 ký tự)</label>
              <input
                id="roomCode"
                type="text"
                className="input room-code-input"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="playerNameJoin">Tên của bạn</label>
              <input
                id="playerNameJoin"
                type="text"
                className="input"
                placeholder="Nhập biệt danh của bạn..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  playClickSound();
                  setMode('choose');
                }}
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!playerName.trim() || !roomCode.trim()}
              >
                Tham Gia
              </button>
            </div>
          </form>
        )}
      </div>

      <CosmeticsModal
        isOpen={isCosmeticsOpen}
        onClose={() => setIsCosmeticsOpen(false)}
        onCosmeticsChange={(updated) => setCosmetics(updated)}
      />

      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%);
        }

        .home-container {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          max-width: 460px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          position: relative;
        }

        .home-top-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.5rem;
        }

        .cosmetics-pill-btn {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #c7d2fe;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cosmetics-pill-btn:hover {
          background: #4f46e5;
          color: white;
          transform: scale(1.05);
        }

        .logo-badge {
          display: inline-block;
          background: #ef4444;
          color: white;
          font-weight: 900;
          font-size: 0.85rem;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
        }

        .game-title {
          font-size: 2.2rem;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .game-subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }

        .selected-avatar-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 1rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .big-avatar {
          font-size: 3.2rem;
          line-height: 1;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
          animation: float 2.5s infinite ease-in-out;
        }

        .quick-avatars-row {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .quick-avatar-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          font-size: 1.25rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .quick-avatar-btn:hover {
          transform: scale(1.15);
          border-color: #60a5fa;
        }

        .quick-avatar-btn.active {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.2);
          transform: scale(1.12);
        }

        .mode-choices {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mode-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.05rem;
          border-radius: 12px;
        }

        .form {
          text-align: left;
        }

        .form h2 {
          margin-bottom: 1.25rem;
          text-align: center;
          font-size: 1.35rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .room-code-input {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-family: monospace;
          font-weight: 800;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .form-actions .btn {
          flex: 1;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          text-align: center;
          font-weight: 600;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
