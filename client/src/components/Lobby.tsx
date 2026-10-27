import { useState, useEffect } from 'react';
import type { Room } from '@uno/shared';
import { GAME_CONFIG } from '@uno/shared';
import { getSocket, SOCKET_EVENTS } from '../socket';
import { THEMES, type UserCosmetics } from '../cosmetics';
import CosmeticsModal from './CosmeticsModal';
import { playClickSound, playTurnSound } from '../audio';

interface LobbyProps {
  room: Room;
  playerId: string;
  playerName: string;
  onLeave: () => void;
  onToggleReady: (ready: boolean) => void;
  onUpdateCosmetics?: (cosmetics: UserCosmetics) => void;
}

export default function Lobby({
  room,
  playerId,
  onLeave,
  onToggleReady,
  onUpdateCosmetics,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
  const isHost = room.hostId === playerId;
  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isReady = currentPlayer?.isReady ?? false;

  const currentTheme =
    THEMES.find((t) => t.id === (room.theme || 'neon')) || THEMES[0];

  const allReady =
    room.players.length >= GAME_CONFIG.MIN_PLAYERS && room.players.every((p) => p.isReady);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyCode = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = room.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  const handleStartGame = () => {
    if (!isHost || !allReady) return;
    playTurnSound();
    getSocket().emit(SOCKET_EVENTS.GAME_START);
  };

  const handleAddBot = () => {
    playClickSound();
    getSocket().emit(SOCKET_EVENTS.ROOM_BOT_ADD);
  };

  const handleThemeChange = (themeId: string) => {
    if (isHost) {
      getSocket().emit(SOCKET_EVENTS.ROOM_SET_THEME, { theme: themeId });
    }
  };

  const handleCosmeticsChange = (cosmetics: UserCosmetics) => {
    onUpdateCosmetics?.(cosmetics);
    getSocket().emit(SOCKET_EVENTS.PLAYER_UPDATE_COSMETICS, {
      avatar: cosmetics.avatar,
      cardSkin: cosmetics.cardSkin,
    });
  };

  return (
    <div
      className="lobby-page"
      style={{
        background: currentTheme.bgGradient,
      }}
    >
      <div className="lobby-ambient-glow glow-1" />
      <div className="lobby-ambient-glow glow-2" />
      <div className="lobby-container">
        {/* Lobby Header */}
        <div className="lobby-header">
          <div className="room-info">
            <div className="room-title-row">
              <h1>
                Room: <span className="room-code">{room.id}</span>
              </h1>
              <button
                className={`btn btn-secondary copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyCode}
              >
                {copied ? '✓ Đã chép!' : 'Copy Mã'}
              </button>
            </div>
            <div className="theme-indicator-row">
              <span className="theme-pill">
                {currentTheme.badge} Theme: <strong>{currentTheme.name}</strong>
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn btn-secondary cosmetics-btn"
              onClick={() => {
                playClickSound();
                setIsCosmeticsOpen(true);
              }}
            >
              🎨 Ngoại Trang (Themes & Skins)
            </button>
            <button
              className="btn btn-secondary leave-btn"
              onClick={() => {
                playClickSound();
                onLeave();
              }}
            >
              Rời Phòng
            </button>
          </div>
        </div>

        {/* Players Section */}
        <div className="players-section">
          <div className="players-section-header">
            <h2>
              Danh Sách Người Chơi ({room.players.length}/{room.maxPlayers})
            </h2>
            {isHost && room.players.length < room.maxPlayers && (
              <button
                type="button"
                className="btn btn-secondary add-bot-mini-btn"
                onClick={handleAddBot}
                title="Thêm một Bot AI tự động vào phòng"
              >
                🤖 Thêm Bot AI
              </button>
            )}
          </div>

          <div className="players-list">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`player-card ${player.id === playerId ? 'current' : ''} ${
                  player.isReady ? 'ready' : ''
                }`}
              >
                <div className="player-avatar">
                  {player.avatar ? (
                    <span className="avatar-emoji-span">{player.avatar}</span>
                  ) : (
                    player.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="player-info">
                  <span className="player-name">
                    {player.name}
                    {player.id === room.hostId && (
                      <span className="host-badge">👑 Chủ Phòng</span>
                    )}
                    {player.name.includes('Bot') && (
                      <span className="bot-badge">🤖 AI Bot</span>
                    )}
                  </span>
                  <span className="player-status">
                    {player.isReady ? (
                      <span className="ready-text">✓ Đã Sẵn Sàng</span>
                    ) : (
                      <span className="not-ready-text">Chưa sẵn sàng</span>
                    )}
                  </span>
                </div>
                {player.id === playerId && (
                  <button
                    className={`btn ${isReady ? 'btn-secondary' : 'btn-primary'} ready-btn`}
                    onClick={() => {
                      playClickSound();
                      onToggleReady(!isReady);
                    }}
                  >
                    {isReady ? 'Hủy Sẵn Sàng' : 'Sẵn Sàng (Ready)'}
                  </button>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="player-avatar empty-avatar">?</div>
                <div className="player-info">
                  <span className="player-name empty-name">Đang chờ người chơi vào...</span>
                </div>
                {isHost && (
                  <button
                    type="button"
                    className="btn btn-secondary slot-add-bot-btn"
                    onClick={handleAddBot}
                  >
                    + Thêm Bot
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lobby Actions */}
        <div className="lobby-actions">
          {isHost ? (
            <div className="host-actions-group">
              {room.players.length < room.maxPlayers && (
                <button
                  type="button"
                  className="btn btn-secondary add-bot-btn"
                  onClick={handleAddBot}
                  title="Thêm một Bot AI tự động"
                >
                  🤖 Thêm Bot (Add Bot)
                </button>
              )}
              <button
                className="btn btn-primary start-btn"
                onClick={handleStartGame}
                disabled={!isHost || !allReady}
              >
                {allReady
                  ? 'Bắt Đầu Trò Chơi (Start Game)'
                  : `Chờ mọi người bấm Sẵn Sàng (${
                      room.players.filter((p) => p.isReady).length
                    }/${room.players.length})...`}
              </button>
            </div>
          ) : (
            <p className="waiting-message">
              Đang đợi Chủ phòng ({room.players.find((p) => p.id === room.hostId)?.name || 'Host'}) bắt đầu ván...
            </p>
          )}
        </div>
      </div>

      <CosmeticsModal
        isOpen={isCosmeticsOpen}
        onClose={() => setIsCosmeticsOpen(false)}
        isHost={isHost}
        currentRoomTheme={room.theme}
        onThemeChange={handleThemeChange}
        onCosmeticsChange={handleCosmeticsChange}
      />

      <style>{`
        .lobby-page {
          min-height: 100vh;
          padding: 2.5rem 1.5rem;
          transition: background 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .lobby-ambient-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.25;
          pointer-events: none;
        }

        .glow-1 {
          top: -80px;
          left: -80px;
          background: #6366f1;
        }

        .glow-2 {
          bottom: -80px;
          right: -80px;
          background: #f43f5e;
        }

        .lobby-container {
          max-width: 860px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.25rem;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          padding: 1.5rem 2rem;
          border-radius: 24px;
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }

        .room-title-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 0.45rem;
        }

        .room-title-row h1 {
          font-size: 1.7rem;
          margin: 0;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .room-code {
          font-family: monospace;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(124, 58, 237, 0.4) 100%);
          color: #e0e7ff;
          padding: 0.35rem 0.85rem;
          border-radius: 10px;
          letter-spacing: 0.18em;
          border: 1.5px solid rgba(165, 180, 252, 0.5);
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
          font-size: 1.25rem;
        }

        .theme-indicator-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .theme-pill {
          font-size: 0.85rem;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.08);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .cosmetics-btn {
          background: linear-gradient(135deg, #312e81 0%, #4338ca 100%);
          border-color: #818cf8;
          color: #ffffff;
          font-size: 0.9rem;
          padding: 0.65rem 1.25rem;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(67, 56, 202, 0.4);
        }

        .cosmetics-btn:hover {
          background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
        }

        .copy-btn {
          font-size: 0.85rem;
          padding: 0.45rem 1rem;
          border-radius: 10px;
        }

        .copy-btn.copied {
          background: #10b981;
          border-color: #10b981;
          color: white;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
        }

        .leave-btn {
          font-size: 0.9rem;
          padding: 0.65rem 1.25rem;
        }

        .players-section {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
        }

        .players-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .players-section h2 {
          font-size: 1.4rem;
          margin: 0;
          font-weight: 900;
          letter-spacing: -0.01em;
          color: #f8fafc;
        }

        .add-bot-mini-btn {
          font-size: 0.9rem;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          border-color: #a5b4fc;
          color: white;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .add-bot-mini-btn:hover {
          background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.6);
        }

        .slot-add-bot-btn {
          font-size: 0.85rem;
          padding: 0.4rem 1rem;
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.5);
          color: #c7d2fe;
          font-weight: 700;
          border-radius: 8px;
        }

        .slot-add-bot-btn:hover {
          background: #4f46e5;
          color: white;
        }

        .players-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 0.85rem;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 0.35rem;
        }

        .player-card {
          display: flex;
          align-items: center;
          gap: 1.35rem;
          padding: 1.15rem 1.5rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .player-card:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateX(4px);
        }

        .player-card.current {
          background: rgba(79, 70, 229, 0.16);
          border-color: rgba(129, 140, 248, 0.6);
          box-shadow: 0 4px 20px rgba(79, 70, 229, 0.25);
        }

        .player-card.ready {
          border-left: 5px solid #10b981;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
        }

        .player-card.empty {
          opacity: 0.6;
          border: 2px dashed rgba(255, 255, 255, 0.16);
          background: transparent;
        }

        .player-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .avatar-emoji-span {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }

        .player-avatar.empty-avatar {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.35);
          font-size: 1.4rem;
          border: 2px dashed rgba(255, 255, 255, 0.2);
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .player-name {
          font-weight: 800;
          font-size: 1.05rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .host-badge {
          font-size: 0.7rem;
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);
        }

        .you-badge {
          font-size: 0.7rem;
          background: #4f46e5;
          color: white;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 800;
        }

        .bot-badge {
          font-size: 0.7rem;
          background: #0284c7;
          color: white;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 800;
        }

        .skin-tag {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .player-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ready-pill {
          font-size: 0.85rem;
          font-weight: 800;
          padding: 0.35rem 0.95rem;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .ready-pill.ready {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.4);
        }

        .ready-pill.waiting {
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .ready-btn {
          font-size: 0.95rem;
          padding: 0.6rem 1.4rem;
          border-radius: 12px;
          font-weight: 800;
        }

        .ready-btn.is-ready {
          background: #10b981;
          color: white;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }

        .lobby-actions {
          display: flex;
          justify-content: center;
        }

        .host-actions-group {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          width: 100%;
        }

        .add-bot-btn {
          padding: 1.15rem 1.75rem;
          font-size: 1rem;
          border-radius: 16px;
        }

        .start-btn {
          flex: 1;
          padding: 1.15rem 2rem;
          font-size: 1.15rem;
          border-radius: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #6ee7b7;
          box-shadow: 0 6px 25px rgba(16, 185, 129, 0.45);
        }

        .start-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.6);
        }

        .start-btn:disabled {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }

        .waiting-message {
          color: #cbd5e1;
          font-size: 1.05rem;
          font-weight: 600;
          font-style: italic;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
