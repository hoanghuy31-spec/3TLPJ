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
    getSocket().emit('room:bot-add' as any);
  };

  const handleThemeChange = (themeId: string) => {
    if (isHost) {
      getSocket().emit('room:set-theme' as any, { theme: themeId });
    }
  };

  const handleCosmeticsChange = (cosmetics: UserCosmetics) => {
    onUpdateCosmetics?.(cosmetics);
    getSocket().emit('player:update-cosmetics' as any, {
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
          padding: 2rem 1.5rem;
          transition: background 0.4s ease;
        }

        .lobby-container {
          max-width: 820px;
          margin: 0 auto;
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          padding: 1.25rem 1.75rem;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .room-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }

        .room-title-row h1 {
          font-size: 1.5rem;
          margin: 0;
          font-weight: 800;
        }

        .room-code {
          font-family: monospace;
          background: rgba(79, 70, 229, 0.35);
          color: #c7d2fe;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          letter-spacing: 0.12em;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        .theme-pill {
          font-size: 0.8rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cosmetics-btn {
          background: #312e81;
          border-color: #6366f1;
          color: #e0e7ff;
          font-size: 0.85rem;
          padding: 0.6rem 1rem;
          font-weight: 700;
        }

        .cosmetics-btn:hover {
          background: #4338ca;
          color: white;
        }

        .copy-btn {
          font-size: 0.85rem;
          padding: 0.4rem 0.85rem;
        }

        .copy-btn.copied {
          background: #10b981;
          border-color: #10b981;
        }

        .leave-btn {
          font-size: 0.85rem;
          padding: 0.6rem 1rem;
        }

        .players-section {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 1.75rem;
          margin-bottom: 2rem;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        }

        .players-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .players-section h2 {
          font-size: 1.25rem;
          margin: 0;
          font-weight: 800;
        }

        .add-bot-mini-btn {
          font-size: 0.85rem;
          padding: 0.45rem 1rem;
          background: #4f46e5;
          border-color: #818cf8;
          color: white;
          font-weight: 700;
        }

        .add-bot-mini-btn:hover {
          background: #4338ca;
        }

        .slot-add-bot-btn {
          font-size: 0.8rem;
          padding: 0.35rem 0.85rem;
          background: rgba(99, 102, 241, 0.25);
          border-color: rgba(99, 102, 241, 0.5);
          color: #c7d2fe;
          font-weight: 700;
        }

        .slot-add-bot-btn:hover {
          background: #4f46e5;
          color: white;
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .player-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.04);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .player-card.current {
          background: rgba(79, 70, 229, 0.18);
          border-color: rgba(99, 102, 241, 0.6);
        }

        .player-card.ready {
          border-left: 4px solid #10b981;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
        }

        .player-card.empty {
          opacity: 0.65;
          border: 2px dashed rgba(255, 255, 255, 0.15);
        }

        .player-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
        }

        .avatar-emoji-span {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        }

        .player-avatar.empty-avatar {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.4);
          font-size: 1.35rem;
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .player-name {
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .host-badge {
          font-size: 0.7rem;
          background: #f59e0b;
          color: black;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          font-weight: 800;
        }

        .bot-badge {
          font-size: 0.7rem;
          background: #3b82f6;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          font-weight: 800;
        }

        .empty-name {
          color: rgba(255, 255, 255, 0.45);
          font-style: italic;
        }

        .player-status {
          font-size: 0.85rem;
        }

        .ready-text {
          color: #34d399;
          font-weight: 700;
        }

        .not-ready-text {
          color: #94a3b8;
        }

        .ready-btn {
          font-size: 0.9rem;
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
        }

        .lobby-actions {
          text-align: center;
        }

        .host-actions-group {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .add-bot-btn {
          padding: 1rem 1.75rem;
          font-size: 1.05rem;
          background: #312e81;
          border-color: #6366f1;
          border-radius: 12px;
          color: white;
          font-weight: 700;
        }

        .add-bot-btn:hover {
          background: #4338ca;
        }

        .start-btn {
          padding: 1rem 3rem;
          font-size: 1.15rem;
          border-radius: 12px;
          flex: 1;
          min-width: 260px;
          font-weight: 800;
        }

        .waiting-message {
          color: #94a3b8;
          font-style: italic;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
