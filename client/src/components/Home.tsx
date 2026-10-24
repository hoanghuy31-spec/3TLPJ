import { useState } from 'react';
import { getSavedCosmetics, saveCosmetics } from '../cosmetics';
import CosmeticsModal from './CosmeticsModal';
import { playClickSound } from '../audio';

interface HomeProps {
  onCreateRoom: (name: string, avatar?: string, cardSkin?: string) => void;
  onJoinRoom: (roomCode: string, name: string, avatar?: string, cardSkin?: string) => void;
  error: string;
}

const QUICK_AVATARS = ['🦊', '🤖', '🐱', '🐼', '🦁', '👑', '🧙', '🥷', '🚀', '🔥', '💎', '😎'];

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
      {/* Background ambient lighting */}
      <div className="home-ambient-glow glow-1" />
      <div className="home-ambient-glow glow-2" />

      {/* Decorative floating cards in background */}
      <div className="floating-card-bg card-float-1">🃏</div>
      <div className="floating-card-bg card-float-2">👑</div>
      <div className="floating-card-bg card-float-3">⚡</div>
      <div className="floating-card-bg card-float-4">🔥</div>

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
            🎨 Tùy Chỉnh Ngoại Trang & Themes
          </button>
        </div>

        <div className="brand-header">
          <span className="logo-badge">🔥 3TLPJ CASINO & CARD ARENA</span>
          <h1 className="game-title">UNO REALTIME</h1>
          <p className="game-subtitle">Đấu trường bài ma thuật trực tuyến đỉnh cao cùng bạn bè & AI!</p>
        </div>

        {/* Selected Avatar & Customization Showcase */}
        <div className="selected-avatar-banner">
          <div className="avatar-preview-wrap">
            <span className="big-avatar">{cosmetics.avatar}</span>
            <span className="avatar-skin-pill">Skin: {cosmetics.cardSkin.toUpperCase()}</span>
          </div>

          <span className="avatar-select-label">Chọn Avatar Của Bạn</span>
          <div className="quick-avatars-row">
            {QUICK_AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                className={`quick-avatar-btn ${cosmetics.avatar === av ? 'active' : ''}`}
                onClick={() => handleQuickAvatar(av)}
                title={`Chọn avatar ${av}`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {mode === 'choose' && (
          <div className="mode-choices">
            <button
              className="btn btn-primary mode-btn create-btn-gradient"
              onClick={() => {
                playClickSound();
                setMode('create');
              }}
            >
              👑 Tạo Phòng Mới (Host Room)
            </button>
            <button
              className="btn btn-secondary mode-btn join-btn-glass"
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
            <h2>👑 Khởi Tạo Phòng Chơi</h2>
            <div className="form-group">
              <label htmlFor="playerName">Tên Hiển Thị Của Bạn</label>
              <input
                id="playerName"
                type="text"
                className="input name-input-lg"
                placeholder="Nhập tên biệt danh..."
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
                ← Quay lại
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!playerName.trim()}
              >
                Tạo Phòng Ngay 🚀
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="form">
            <h2>🚀 Tham Gia Phòng Chơi</h2>
            <div className="form-group">
              <label htmlFor="roomCode">Mã Phòng (6 ký tự)</label>
              <input
                id="roomCode"
                type="text"
                className="input room-code-input"
                placeholder="VD: ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="playerName">Tên Hiển Thị Của Bạn</label>
              <input
                id="playerName"
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
                ← Quay lại
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!playerName.trim() || !roomCode.trim()}
              >
                Vào Phòng Chơi 🎲
              </button>
            </div>
          </form>
        )}
      </div>

      <CosmeticsModal
        isOpen={isCosmeticsOpen}
        onClose={() => setIsCosmeticsOpen(false)}
        onCosmeticsChange={(up) => setCosmetics(up)}
      />

      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #090d16 80%);
          position: relative;
          overflow: hidden;
        }

        .home-ambient-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.35;
          pointer-events: none;
        }

        .glow-1 {
          top: -100px;
          left: -100px;
          background: #6366f1;
        }

        .glow-2 {
          bottom: -100px;
          right: -100px;
          background: #f43f5e;
        }

        .floating-card-bg {
          position: absolute;
          font-size: 5rem;
          opacity: 0.12;
          pointer-events: none;
          user-select: none;
        }

        .card-float-1 { top: 12%; left: 10%; animation: floatSlow 7s infinite ease-in-out; }
        .card-float-2 { bottom: 15%; left: 8%; animation: floatSlow 9s infinite ease-in-out reverse; }
        .card-float-3 { top: 15%; right: 12%; animation: floatSlow 8s infinite ease-in-out; }
        .card-float-4 { bottom: 12%; right: 10%; animation: floatSlow 6s infinite ease-in-out reverse; }

        .home-container {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          border-radius: 28px;
          padding: 2.75rem 2.25rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15);
          position: relative;
          z-index: 10;
        }

        .home-top-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.75rem;
        }

        .cosmetics-pill-btn {
          background: rgba(99, 102, 241, 0.18);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #c7d2fe;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .cosmetics-pill-btn:hover {
          background: #4f46e5;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
        }

        .brand-header {
          margin-bottom: 1.5rem;
        }

        .logo-badge {
          display: inline-block;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          color: white;
          font-weight: 900;
          font-size: 0.75rem;
          padding: 0.3rem 0.85rem;
          border-radius: 999px;
          letter-spacing: 0.08em;
          margin-bottom: 0.6rem;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .game-title {
          font-size: 2.8rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 0.35rem;
          background: linear-gradient(135deg, #f43f5e 0%, #fbbf24 50%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 14px rgba(244, 63, 94, 0.35));
        }

        .game-subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .selected-avatar-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 1.25rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .avatar-preview-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .big-avatar {
          font-size: 3.8rem;
          line-height: 1;
          margin-bottom: 0.4rem;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));
          animation: floatSlow 3s infinite ease-in-out;
        }

        .avatar-skin-pill {
          font-size: 0.75rem;
          font-weight: 800;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }

        .avatar-select-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }

        .quick-avatars-row {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .quick-avatar-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          font-size: 1.35rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .quick-avatar-btn:hover {
          transform: translateY(-4px) scale(1.15);
          background: rgba(255, 255, 255, 0.15);
          border-color: #60a5fa;
        }

        .quick-avatar-btn.active {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.25);
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
          transform: translateY(-2px) scale(1.15);
        }

        .mode-choices {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .mode-btn {
          width: 100%;
          padding: 1.15rem;
          font-size: 1.1rem;
          border-radius: 16px;
        }

        .create-btn-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .create-btn-gradient:hover {
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.6);
        }

        .join-btn-glass {
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
        }

        .form {
          text-align: left;
          animation: fadeIn 0.25s ease-out;
        }

        .form h2 {
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: #f8fafc;
        }

        .form-group {
          margin-bottom: 1.35rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .name-input-lg {
          font-size: 1.05rem;
          padding: 0.95rem 1.25rem;
        }

        .room-code-input {
          text-align: center;
          font-size: 1.8rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-family: monospace;
          font-weight: 900;
          color: #fbbf24;
          background: rgba(0, 0, 0, 0.4);
          border-color: rgba(251, 191, 36, 0.4);
        }

        .room-code-input:focus {
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.75rem;
        }

        .form-actions .btn {
          flex: 1;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.9rem;
          margin-top: 0.65rem;
          text-align: center;
          font-weight: 700;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.5rem;
          border-radius: 8px;
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
