import { useState, useEffect, useRef } from 'react';
import type { Card as CardType, CardColor, GameState, Room } from '@uno/shared';
import { getSocket, SOCKET_EVENTS } from '../socket';
import Card from './Card';
import ColorPicker from './ColorPicker';
import Hand from './Hand';
import CosmeticsModal from './CosmeticsModal';
import { THEMES, getSavedCosmetics } from '../cosmetics';
import {
  playCardSound,
  playDrawSound,
  playTurnSound,
  playUnoSound,
  playWinSound,
  playClickSound,
} from '../audio';

interface GameBoardProps {
  room: Room;
  gameState: GameState;
  playerId: string;
  playerName: string;
  onLeave: () => void;
  onBackToLobby?: () => void;
}

const COLOR_NAMES: Record<CardColor, { name: string; bg: string }> = {
  red: { name: 'Đỏ', bg: '#e11d48' },
  blue: { name: 'Lam', bg: '#2563eb' },
  green: { name: 'Lục', bg: '#059669' },
  yellow: { name: 'Vàng', bg: '#d97706' },
  black: { name: 'Wild', bg: '#18181b' },
};

export default function GameBoard({
  room,
  gameState,
  playerId,
  onLeave,
  onBackToLobby,
}: GameBoardProps) {
  const [pendingWildCard, setPendingWildCard] = useState<CardType | null>(null);
  const [unoMessage, setUnoMessage] = useState<string>('');
  const [actionAlert, setActionAlert] = useState<{ title: string; desc: string; icon: string } | null>(
    null
  );
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
  const [cosmetics, setCosmetics] = useState(() => getSavedCosmetics());
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const prevTurnRef = useRef<string | null>(null);
  const socket = getSocket();

  // Find current player state
  const myPlayerState = gameState.players.find((p) => p.id === playerId);
  const myCards = myPlayerState?.cards || [];

  // Determine current turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  // Active theme
  const currentTheme =
    THEMES.find((t) => t.id === (room.theme || cosmetics.theme || 'neon')) || THEMES[0];
  const mySkin = myPlayerState?.cardSkin || cosmetics.cardSkin || 'classic';

  // Opponents
  const opponents = gameState.players.filter((p) => p.id !== playerId);

  // Top card on discard pile
  const topCard =
    gameState.discardPile[gameState.discardPile.length - 1] || gameState.lastPlayedCard;

  // Active color
  const currentColorInfo = COLOR_NAMES[gameState.currentColor] || {
    name: 'Đỏ',
    bg: '#e11d48',
  };

  // Play turn notification sound when turn shifts to player
  useEffect(() => {
    if (currentPlayer && currentPlayer.id !== prevTurnRef.current) {
      prevTurnRef.current = currentPlayer.id;
      if (currentPlayer.id === playerId) {
        playTurnSound();
      }
    }
  }, [currentPlayer, playerId]);

  // Check last played card for action banners
  useEffect(() => {
    if (gameState.lastPlayedCard) {
      playCardSound();
      const val = gameState.lastPlayedCard.value;
      if (val === 'skip') {
        triggerAlert('⛔ BỎ QUA LƯỢT (SKIP)!', 'Người chơi kế tiếp đã bị mất lượt!', '⛔');
      } else if (val === 'reverse') {
        triggerAlert('🔄 ĐỔI CHIỀU CHƠI!', 'Chiều đánh của bàn cờ đã bị đảo ngược!', '🔄');
      } else if (val === 'draw2') {
        triggerAlert('💥 PHẠT RÚT +2 LÁ!', 'Người chơi kế tiếp phải rút 2 lá và mất lượt!', '💥');
      } else if (val === 'wild_draw4') {
        triggerAlert('🔥 PHẠT RÚT +4 LÁ!', 'Đổi màu bàn chơi & Người kế tiếp phải rút 4 lá!', '🔥');
      }
    }
  }, [gameState.lastPlayedCard]);

  // Confetti effect when game ends
  useEffect(() => {
    if (gameState.status === 'ended') {
      playWinSound();
      runConfetti();
    }
  }, [gameState.status]);

  const triggerAlert = (title: string, desc: string, icon: string) => {
    setActionAlert({ title, desc, icon });
    const timer = setTimeout(() => setActionAlert(null), 2500);
    return () => clearTimeout(timer);
  };

  const runConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: { x: number; y: number; size: number; color: string; vx: number; vy: number; rot: number; vrot: number }[] = [];
    const colors = ['#e11d48', '#2563eb', '#059669', '#d97706', '#fbbf24', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.5,
        size: 8 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: -2 + Math.random() * 4,
        vy: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: -0.1 + Math.random() * 0.2,
      });
    }

    let animationId: number;
    let frames = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frames++;
      if (frames < 240) {
        animationId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  };

  // Determine playable cards in hand
  const playableCardIds = myCards
    .filter((card) => {
      if (card.color === 'black') return true;
      if (card.color === gameState.currentColor) return true;
      if (topCard && card.value === topCard.value) return true;
      return false;
    })
    .map((c) => c.id);

  // Handle playing card
  const handleCardClick = (card: CardType) => {
    if (!isMyTurn) return;

    if (card.color === 'black') {
      playClickSound();
      setPendingWildCard(card);
    } else {
      playCardSound();
      socket.emit(SOCKET_EVENTS.CARD_PLAY, {
        cardId: card.id,
      });
    }
  };

  // Handle color selection for wild cards
  const handleColorSelected = (chosenColor: CardColor) => {
    if (!pendingWildCard) return;

    playCardSound();
    socket.emit(SOCKET_EVENTS.CARD_PLAY, {
      cardId: pendingWildCard.id,
      chosenColor,
    });
    setPendingWildCard(null);
  };

  // Handle draw card
  const handleDrawCard = () => {
    if (!isMyTurn) return;
    playDrawSound();
    socket.emit(SOCKET_EVENTS.CARD_DRAW);
  };

  // Handle call UNO
  const handleCallUno = () => {
    playUnoSound();
    socket.emit(SOCKET_EVENTS.UNO_CALL);
    setUnoMessage('BẠN ĐÃ HÔ UNO! 🔥');
    setTimeout(() => setUnoMessage(''), 3000);
  };

  const isWinner = gameState.status === 'ended' && myPlayerState?.cards.length === 0;
  const winnerPlayer = gameState.players.find((p) => p.cards.length === 0);

  return (
    <div
      className="gameboard-container"
      style={{
        background: currentTheme.bgGradient,
      }}
    >
      {/* Confetti celebration canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />

      {/* TOP HEADER */}
      <header className="game-header">
        <div className="header-left">
          <span className="room-badge">Phòng: {room.id}</span>
          <span className="theme-pill-badge">
            {currentTheme.badge} {currentTheme.name}
          </span>
          <span className="turn-count">Lượt #{gameState.turnNumber}</span>
          <span className="direction-badge">
            {gameState.direction === 1 ? '↻ Theo chiều kim đồng hồ' : '↺ Ngược chiều kim đồng hồ'}
          </span>
        </div>

        <div className="header-center">
          <div className="active-turn-indicator">
            {isMyTurn ? (
              <span className="your-turn-pill">👉 ĐẾN LƯỢT BẠN!</span>
            ) : (
              <span className="opponent-turn-pill">
                Đang chờ <strong>{currentPlayer?.name}</strong> đánh...
              </span>
            )}
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn btn-secondary cosmetics-btn"
            onClick={() => {
              playClickSound();
              setIsCosmeticsOpen(true);
            }}
          >
            🎨 Ngoại Trang
          </button>
          <button
            className="btn btn-secondary leave-game-btn"
            onClick={() => {
              playClickSound();
              onLeave();
            }}
          >
            Rời Bàn
          </button>
        </div>
      </header>

      {/* ACTION ALERT BANNER */}
      {actionAlert && (
        <div className="action-alert-toast">
          <span className="alert-icon">{actionAlert.icon}</span>
          <div className="alert-text">
            <strong>{actionAlert.title}</strong>
            <span>{actionAlert.desc}</span>
          </div>
        </div>
      )}

      {/* OPPONENTS AREA */}
      <section className="opponents-section">
        {opponents.map((opp) => {
          const isOppTurn = currentPlayer?.id === opp.id;
          return (
            <div
              key={opp.id}
              className={`opponent-card ${isOppTurn ? 'active-turn' : ''}`}
            >
              <div className="opponent-avatar-wrap">
                <div className={`opponent-avatar ${isOppTurn ? 'ring-active' : ''}`}>
                  {opp.avatar ? (
                    <span className="avatar-emoji-span">{opp.avatar}</span>
                  ) : (
                    opp.name.charAt(0).toUpperCase()
                  )}
                  {opp.unoCalled && <span className="uno-badge-pill">UNO!</span>}
                </div>
              </div>
              <div className="opponent-details">
                <span className="opponent-name">
                  {opp.name}
                  {opp.name.includes('Bot') && <span className="bot-chip">AI</span>}
                </span>
                <span className="opponent-cards-count">
                  🃏 {opp.cards.length} {opp.cards.length === 1 ? 'lá' : 'lá bài'}
                </span>
              </div>
              {isOppTurn && <span className="thinking-dot">Đang nghĩ...</span>}
            </div>
          );
        })}
      </section>

      {/* CENTER ARENA (DECK & DISCARD PILE) */}
      <section className="center-arena">
        {/* Draw Pile */}
        <div className="pile-container draw-pile-container">
          <span className="pile-title">Xấp Bài Rút</span>
          <div
            className={`deck-stack ${isMyTurn ? 'can-draw' : ''}`}
            onClick={handleDrawCard}
            title={isMyTurn ? 'Click để rút bài' : 'Chờ đến lượt của bạn'}
          >
            <Card faceDown size="lg" isPlayable={isMyTurn} skin={mySkin} />
            <span className="deck-count-overlay">{gameState.deck.length} lá</span>
          </div>
          {isMyTurn && (
            <button className="btn btn-secondary draw-btn" onClick={handleDrawCard}>
              Rút Bài
            </button>
          )}
        </div>

        {/* Discard Pile */}
        <div className="pile-container discard-pile-container">
          <div className="discard-header">
            <span className="pile-title">Bài Đang Đánh</span>
            <div
              className="active-color-pill"
              style={{ backgroundColor: currentColorInfo.bg }}
            >
              Màu Hiện Tại: {currentColorInfo.name}
            </div>
          </div>
          <div className="discard-top-slot">
            {topCard ? (
              <Card card={topCard} size="lg" />
            ) : (
              <div className="empty-pile">Chưa có bài</div>
            )}
          </div>
        </div>
      </section>

      {/* UNO ALERT / TOAST */}
      {unoMessage && <div className="uno-toast">{unoMessage}</div>}

      {/* BOTTOM AREA: PLAYER CONTROLS & HAND */}
      <footer className="game-footer">
        <div className="player-action-bar">
          <button
            className={`btn btn-uno ${
              myCards.length <= 2 && !myPlayerState?.unoCalled ? 'pulse' : ''
            }`}
            onClick={handleCallUno}
            disabled={myPlayerState?.unoCalled}
          >
            {myPlayerState?.unoCalled ? '✓ ĐÃ HÔ UNO!' : 'HÔ UNO! 🔥'}
          </button>
        </div>

        <Hand
          cards={myCards}
          playableCardIds={playableCardIds}
          isMyTurn={isMyTurn}
          onPlayCard={handleCardClick}
          selectedCardId={pendingWildCard?.id}
        />
      </footer>

      {/* COLOR PICKER MODAL */}
      {pendingWildCard && (
        <ColorPicker
          onSelectColor={handleColorSelected}
          onCancel={() => setPendingWildCard(null)}
        />
      )}

      {/* COSMETICS MODAL */}
      <CosmeticsModal
        isOpen={isCosmeticsOpen}
        onClose={() => setIsCosmeticsOpen(false)}
        isHost={room.hostId === playerId}
        currentRoomTheme={room.theme}
        onThemeChange={(th) => {
          if (room.hostId === playerId) {
            socket.emit('room:set-theme' as any, { theme: th });
          }
        }}
        onCosmeticsChange={(up) => {
          setCosmetics(up);
          socket.emit('player:update-cosmetics' as any, {
            avatar: up.avatar,
            cardSkin: up.cardSkin,
          });
        }}
      />

      {/* GAME OVER MODAL */}
      {gameState.status === 'ended' && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <div className="trophy-icon">🏆</div>
            <h2>Ván Đấu Hoàn Tất!</h2>
            <p className="winner-announce">
              {isWinner ? (
                <span className="you-won">🎉 XIN CHÚC MỪNG! BẠN ĐÃ CHIẾN THẮNG! 🎉</span>
              ) : (
                <span>
                  Người chiến thắng: <strong>{winnerPlayer?.name || 'Đối thủ'}</strong> 👏
                </span>
              )}
            </p>

            <div className="final-players-list">
              {gameState.players.map((p) => (
                <div key={p.id} className="final-player-row">
                  <span className="final-p-name">
                    {p.avatar || '👤'} {p.name}
                  </span>
                  <span className="final-p-cards">
                    {p.cards.length === 0 ? '🏆 Hết bài (Thắng)' : `${p.cards.length} lá còn lại`}
                  </span>
                </div>
              ))}
            </div>

            <div className="game-over-actions">
              {onBackToLobby && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    playClickSound();
                    onBackToLobby();
                  }}
                >
                  Về Phòng Chờ (Lobby)
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  playClickSound();
                  onLeave();
                }}
              >
                Rời Phòng
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gameboard-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #f8fafc;
          overflow-x: hidden;
          position: relative;
          transition: background 0.4s ease;
        }

        .confetti-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
        }

        .game-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.75rem;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .room-badge {
          background: #312e81;
          color: #c7d2fe;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.85rem;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        .theme-pill-badge {
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          padding: 0.25rem 0.65rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .turn-count, .direction-badge {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .your-turn-pill {
          background: #fbbf24;
          color: #78350f;
          padding: 0.45rem 1.5rem;
          border-radius: 9999px;
          font-weight: 900;
          font-size: 1rem;
          animation: bounce 1.2s infinite;
          display: inline-block;
          box-shadow: 0 4px 14px rgba(251, 191, 36, 0.5);
        }

        .opponent-turn-pill {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          padding: 0.45rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cosmetics-btn {
          font-size: 0.85rem;
          padding: 0.5rem 1rem;
          background: #312e81;
          border-color: #6366f1;
        }

        .cosmetics-btn:hover {
          background: #4338ca;
        }

        .action-alert-toast {
          position: fixed;
          top: 75px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid #fbbf24;
          padding: 0.75rem 2rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 100;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(251, 191, 36, 0.5);
          animation: slideDown 0.3s ease-out;
        }

        .alert-icon {
          font-size: 1.8rem;
        }

        .alert-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .alert-text strong {
          color: #fbbf24;
          font-size: 1rem;
        }

        .alert-text span {
          color: #e2e8f0;
          font-size: 0.8rem;
        }

        .opponents-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 1.25rem;
          flex-wrap: wrap;
        }

        .opponent-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background: rgba(15, 23, 42, 0.75);
          border: 2px solid rgba(255, 255, 255, 0.1);
          padding: 0.65rem 1.25rem;
          border-radius: 14px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .opponent-card.active-turn {
          border-color: #fbbf24;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
          transform: scale(1.06);
          background: rgba(30, 41, 59, 0.9);
        }

        .opponent-avatar-wrap {
          position: relative;
        }

        .opponent-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          position: relative;
        }

        .ring-active {
          box-shadow: 0 0 0 3px #fbbf24;
          animation: pulseRing 1.5s infinite;
        }

        .uno-badge-pill {
          position: absolute;
          top: -8px;
          right: -12px;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 9999px;
          border: 1px solid #ffffff;
          animation: pulse 1s infinite;
        }

        .opponent-details {
          display: flex;
          flex-direction: column;
        }

        .opponent-name {
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .bot-chip {
          background: #3b82f6;
          color: white;
          font-size: 0.65rem;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 800;
        }

        .opponent-cards-count {
          color: #94a3b8;
          font-size: 0.8rem;
        }

        .thinking-dot {
          color: #fbbf24;
          font-size: 0.8rem;
          font-style: italic;
          margin-left: 0.5rem;
          animation: pulse 1s infinite;
        }

        .center-arena {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5rem;
          padding: 1.5rem;
        }

        .pile-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }

        .pile-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .discard-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .active-color-pill {
          color: #ffffff;
          font-weight: 800;
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.6);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          animation: pulse 2s infinite;
        }

        .deck-stack {
          position: relative;
          cursor: default;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.5));
          transition: transform 0.2s ease;
        }

        .deck-stack.can-draw:hover {
          transform: translateY(-8px) scale(1.05);
        }

        .deck-count-overlay {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 10;
        }

        .draw-btn {
          margin-top: 0.35rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 700;
          border-radius: 8px;
        }

        .uno-toast {
          position: fixed;
          top: 130px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          font-weight: 900;
          font-size: 1.25rem;
          padding: 0.75rem 2.5rem;
          border-radius: 9999px;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.6);
          z-index: 150;
          animation: slideDown 0.3s ease;
          border: 2px solid #ffffff;
        }

        .game-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
        }

        .player-action-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-top: 0.85rem;
        }

        .btn-uno {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          font-weight: 900;
          font-size: 1.15rem;
          padding: 0.7rem 2.5rem;
          border-radius: 9999px;
          border: 3px solid #fecdd3;
          letter-spacing: 0.05em;
          box-shadow: 0 6px 18px rgba(239, 68, 68, 0.5);
          transition: transform 0.15s ease;
        }

        .btn-uno:hover:not(:disabled) {
          transform: scale(1.08);
          background: #dc2626;
        }

        .btn-uno.pulse {
          animation: pulse 1s infinite;
        }

        .btn-uno:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .game-over-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 500;
          animation: fadeIn 0.25s ease-out;
        }

        .game-over-modal {
          background: #0f172a;
          border: 2px solid #6366f1;
          border-radius: 24px;
          padding: 2.75rem 2rem;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.5);
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .trophy-icon {
          font-size: 4.5rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 6px 12px rgba(251, 191, 36, 0.5));
        }

        .winner-announce {
          font-size: 1.35rem;
          margin: 1rem 0 1.5rem;
        }

        .you-won {
          color: #fbbf24;
          font-weight: 900;
          font-size: 1.4rem;
        }

        .final-players-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 2rem;
          text-align: left;
          background: rgba(0, 0, 0, 0.35);
          padding: 1.25rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .final-player-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: #cbd5e1;
          align-items: center;
        }

        .final-p-name {
          font-weight: 700;
        }

        .final-p-cards {
          color: #94a3b8;
        }

        .game-over-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 3px #fbbf24; }
          50% { box-shadow: 0 0 0 6px rgba(251, 191, 36, 0.6); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
