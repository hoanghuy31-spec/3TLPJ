import { useState, useEffect, useRef, useCallback } from 'react';
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
  playCatchSound,
  playDiceSound,
  playReverseSound,
} from '../audio';

interface GameBoardProps {
  room: Room;
  gameState: GameState;
  playerId: string;
  playerName: string;
  onLeave: () => void;
  onBackToLobby?: () => void;
}

const COLOR_NAMES: Record<CardColor, { name: string; bg: string; glow: string }> = {
  red: { name: 'Đỏ', bg: '#ef4444', glow: 'rgba(239, 68, 68, 0.7)' },
  blue: { name: 'Lam', bg: '#3b82f6', glow: 'rgba(59, 130, 246, 0.7)' },
  green: { name: 'Lục', bg: '#10b981', glow: 'rgba(16, 185, 129, 0.7)' },
  yellow: { name: 'Vàng', bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.7)' },
  black: { name: 'Wild', bg: '#1e293b', glow: 'rgba(255, 255, 255, 0.4)' },
};

type SeatPosition =
  | 'left'
  | 'left-top'
  | 'left-bottom'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'right'
  | 'right-top'
  | 'right-bottom';

export default function GameBoard({
  room,
  gameState,
  playerId,
  playerName,
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
  const [chatInput, setChatInput] = useState('');
  const [firstPlayerCeremony, setFirstPlayerCeremony] = useState<{
    isOpen: boolean;
    playerName: string;
    isMe: boolean;
  } | null>(null);

  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevTurnRef = useRef<string | null>(null);
  const prevDirectionRef = useRef<number>(gameState.direction);
  const hasCeremonyRunRef = useRef<boolean>(false);
  const socket = getSocket();

  // Find player states
  const myPlayerState = gameState.players.find((p) => p.id === playerId);
  const myCards = myPlayerState?.cards || [];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  // Active theme
  const currentTheme =
    THEMES.find((t) => t.id === (room.theme || cosmetics.theme || 'neon')) || THEMES[0];
  const mySkin = myPlayerState?.cardSkin || cosmetics.cardSkin || 'classic';

  // Opponents list
  const opponents = gameState.players.filter((p) => p.id !== playerId);

  // Top card on discard pile
  const topCard =
    gameState.discardPile[gameState.discardPile.length - 1] || gameState.lastPlayedCard;

  // Active color info
  const currentColorInfo = COLOR_NAMES[gameState.currentColor] || COLOR_NAMES.red;

  const triggerAlert = useCallback((title: string, desc: string, icon: string) => {
    setActionAlert({ title, desc, icon });
    const timer = setTimeout(() => setActionAlert(null), 2800);
    return () => clearTimeout(timer);
  }, []);

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
  const handleCallUno = useCallback(() => {
    if (myPlayerState?.unoCalled) return;
    playUnoSound();
    socket.emit(SOCKET_EVENTS.UNO_CALL);
    setUnoMessage('BẠN ĐÃ HÔ UNO! 🔥');
    setTimeout(() => setUnoMessage(''), 3000);
  }, [myPlayerState?.unoCalled, socket]);

  // Handle catch missed UNO
  const handleCatchUno = useCallback(
    (targetPlayerId?: string) => {
      playClickSound();
      socket.emit(SOCKET_EVENTS.UNO_CATCH, { targetPlayerId });
    },
    [socket]
  );

  // Handle chat/command submission
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = chatInput.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === '/uno' || cmd === 'uno') {
      handleCallUno();
    } else if (cmd === '/bat' || cmd === '/catch' || cmd === 'bat' || cmd === 'catch') {
      handleCatchUno();
    } else if (cmd === '/rut' || cmd === '/draw') {
      handleDrawCard();
    } else {
      triggerAlert('💬 Tin nhắn', `${playerName}: ${chatInput}`, '💬');
    }
    setChatInput('');
  };

  // Turn sound notification
  useEffect(() => {
    if (currentPlayer && currentPlayer.id !== prevTurnRef.current) {
      prevTurnRef.current = currentPlayer.id;
      if (currentPlayer.id === playerId) {
        playTurnSound();
      }
    }
  }, [currentPlayer, playerId]);

  // Direction reverse sound & animation
  useEffect(() => {
    if (prevDirectionRef.current !== gameState.direction) {
      prevDirectionRef.current = gameState.direction;
      playReverseSound();
    }
  }, [gameState.direction]);

  // Random First Player Roll Ceremony on turn 1
  useEffect(() => {
    if (gameState.turnNumber === 1 && !hasCeremonyRunRef.current && currentPlayer) {
      hasCeremonyRunRef.current = true;
      playDiceSound();
      setFirstPlayerCeremony({
        isOpen: true,
        playerName: currentPlayer.name,
        isMe: currentPlayer.id === playerId,
      });

      const timer = setTimeout(() => {
        setFirstPlayerCeremony(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [gameState.turnNumber, currentPlayer, playerId]);

  // Listen for UNO call and catch events
  useEffect(() => {
    const handleUnoCalled = (data: { playerId: string; playerName?: string }) => {
      playUnoSound();
      const p = gameState.players.find((pl) => pl.id === data.playerId);
      const name = data.playerName || p?.name || 'Một người chơi';
      triggerAlert('🎉 HÔ UNO!', `${name} chỉ còn lại 1 lá bài!`, '🎉');
    };

    const handleUnoCaught = (data: {
      catcherId: string;
      catcherName: string;
      victimId: string;
      victimName: string;
      penaltyCards: number;
    }) => {
      playCatchSound();
      triggerAlert(
        '🚨 BẮT BÀI UNO THÀNH CÔNG!',
        `${data.catcherName} đã bắt ${data.victimName} quên hô UNO! Phạt rút ${data.penaltyCards} lá bài!`,
        '🚨'
      );
    };

    const handleGameError = (data: { message: string }) => {
      if (data.message && (data.message.includes('UNO') || data.message.includes('bắt'))) {
        triggerAlert('⚠️ Thông báo UNO', data.message, '⚠️');
      } else if (
        data.message &&
        (data.message.includes('xào lại') ||
          data.message.includes('Xấp bài') ||
          data.message.includes('cạn') ||
          data.message.includes('mới'))
      ) {
        playDrawSound();
        triggerAlert('🔄 XÀO LẠI BÀI!', data.message, '🔄');
      }
    };

    socket.on(SOCKET_EVENTS.PLAYER_UNO_CALLED, handleUnoCalled);
    socket.on(SOCKET_EVENTS.PLAYER_UNO_CAUGHT, handleUnoCaught);
    socket.on(SOCKET_EVENTS.GAME_ERROR, handleGameError);

    return () => {
      socket.off(SOCKET_EVENTS.PLAYER_UNO_CALLED, handleUnoCalled);
      socket.off(SOCKET_EVENTS.PLAYER_UNO_CAUGHT, handleUnoCaught);
      socket.off(SOCKET_EVENTS.GAME_ERROR, handleGameError);
    };
  }, [socket, gameState.players, triggerAlert]);

  // Keyboard shortcuts (U: Hô UNO, B: Bắt bài)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        handleCallUno();
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'c' || e.key === 'C') {
        handleCatchUno();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCallUno, handleCatchUno]);

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
  }, [gameState.lastPlayedCard, triggerAlert]);

  // Confetti celebration when game ends
  useEffect(() => {
    if (gameState.status === 'ended') {
      playWinSound();
      const canvas = confettiCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const pieces: {
        x: number;
        y: number;
        size: number;
        color: string;
        vx: number;
        vy: number;
        rot: number;
        vrot: number;
      }[] = [];
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

      for (let i = 0; i < 140; i++) {
        pieces.push({
          x: Math.random() * canvas.width,
          y: Math.random() * -canvas.height * 0.5,
          size: 8 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: -2.5 + Math.random() * 5,
          vy: 3 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          vrot: -0.15 + Math.random() * 0.3,
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
        if (frames < 260) {
          animationId = requestAnimationFrame(draw);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      draw();
      return () => cancelAnimationFrame(animationId);
    }
  }, [gameState.status]);

  // Seating arrangement calculations around the Steam Oval Table (Supports 2 - 10 players)
  const myIndex = gameState.players.findIndex((p) => p.id === playerId);
  const totalPlayers = gameState.players.length;
  const opponentCount = totalPlayers - 1;

  const relativeOpponents: { player: (typeof gameState.players)[0]; seat: SeatPosition }[] = [];
  for (let i = 1; i < totalPlayers; i++) {
    const oppIdx = (myIndex + i) % totalPlayers;
    const opp = gameState.players[oppIdx];

    let seat: SeatPosition = 'top';
    if (opponentCount === 1) {
      seat = 'top';
    } else if (opponentCount === 2) {
      seat = i === 1 ? 'left' : 'right';
    } else if (opponentCount === 3) {
      if (i === 1) seat = 'left';
      else if (i === 2) seat = 'top';
      else seat = 'right';
    } else if (opponentCount === 4) {
      if (i === 1) seat = 'left';
      else if (i === 2) seat = 'top-left';
      else if (i === 3) seat = 'top-right';
      else seat = 'right';
    } else if (opponentCount === 5) {
      const p5: SeatPosition[] = ['left-bottom', 'left-top', 'top', 'right-top', 'right-bottom'];
      seat = p5[i - 1] || 'top';
    } else if (opponentCount === 6) {
      const p6: SeatPosition[] = ['left-bottom', 'left-top', 'top-left', 'top-right', 'right-top', 'right-bottom'];
      seat = p6[i - 1] || 'top';
    } else if (opponentCount === 7) {
      const p7: SeatPosition[] = ['left-bottom', 'left', 'left-top', 'top', 'right-top', 'right', 'right-bottom'];
      seat = p7[i - 1] || 'top';
    } else if (opponentCount === 8) {
      const p8: SeatPosition[] = ['left-bottom', 'left', 'left-top', 'top-left', 'top-right', 'right-top', 'right', 'right-bottom'];
      seat = p8[i - 1] || 'top';
    } else {
      const p9: SeatPosition[] = ['left-bottom', 'left', 'left-top', 'top-left', 'top', 'top-right', 'right-top', 'right', 'right-bottom'];
      seat = p9[(i - 1) % p9.length];
    }

    relativeOpponents.push({ player: opp, seat });
  }

  const isWinner = gameState.status === 'ended' && myPlayerState?.cards.length === 0;
  const winnerPlayer = gameState.players.find((p) => p.cards.length === 0);

  const isMyUnoUrgent = myCards.length === 1 && !myPlayerState?.unoCalled;
  const canCatchSomeone = opponents.some((o) => o.cards.length === 1 && !o.unoCalled);
  const uncalledCount = opponents.filter((o) => o.cards.length === 1 && !o.unoCalled).length;

  return (
    <div
      className="steam-gameboard-container"
      style={{
        background: currentTheme.bgGradient,
      }}
    >
      {/* Confetti celebration canvas */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" />

      {/* TOP STEAM HEADER */}
      <header className="steam-header">
        <div className="steam-header-left">
          <div className="steam-badge-room">
            <span className="badge-label">PHÒNG</span>
            <span className="badge-val">{room.id}</span>
          </div>
          <div className="steam-theme-pill">
            <span>{currentTheme.badge}</span>
            <span>{currentTheme.name}</span>
          </div>
          <div className="steam-turn-pill">
            Lượt #{gameState.turnNumber}
          </div>
        </div>

        <div className="steam-header-center">
          <div className="steam-turn-announcer">
            {isMyTurn ? (
              <div className="announcer-tag my-turn pulse-glow">
                <span className="turn-sparkle">✨</span>
                <span>👉 ĐẾN LƯỢT BẠN! HÃY ĐÁNH BÀI</span>
                <span className="turn-sparkle">✨</span>
              </div>
            ) : (
              <div className="announcer-tag waiting-turn">
                <span className="hourglass-spin">⏳</span>
                <span>
                  Đang chờ <strong>{currentPlayer?.name}</strong> suy nghĩ...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="steam-header-right">
          <button
            className="steam-nav-btn cosmetics"
            onClick={() => {
              playClickSound();
              setIsCosmeticsOpen(true);
            }}
          >
            🎨 Ngoại Trang
          </button>
          <button
            className="steam-nav-btn leave"
            onClick={() => {
              playClickSound();
              onLeave();
            }}
          >
            🚪 Rời Bàn
          </button>
        </div>
      </header>

      {/* ACTION ALERT TOAST */}
      {actionAlert && (
        <div className="steam-action-alert">
          <span className="alert-emoji">{actionAlert.icon}</span>
          <div className="alert-content">
            <h4 className="alert-title">{actionAlert.title}</h4>
            <p className="alert-desc">{actionAlert.desc}</p>
          </div>
        </div>
      )}

      {/* UNO TOAST BANNER */}
      {unoMessage && <div className="steam-uno-toast">{unoMessage}</div>}

      {/* FIRST PLAYER RANDOM CEREMONY OVERLAY */}
      {firstPlayerCeremony?.isOpen && (
        <div
          className="first-player-overlay"
          onClick={() => setFirstPlayerCeremony(null)}
        >
          <div
            className="first-player-card animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dice-roll-icon-wrap">
              <span className="dice-rolling-emoji">🎲</span>
            </div>
            <h2 className="dice-ceremony-title">LỰA CHỌN NGƯỜI ĐI ĐẦU TIÊN</h2>
            <p className="dice-ceremony-sub">
              Hệ thống đã chọn ngẫu nhiên người đánh lá bài mở màn:
            </p>

            <div className="dice-winner-card">
              <div className="dice-winner-avatar">
                {currentPlayer?.avatar || '👤'}
              </div>
              <div className="dice-winner-name">{firstPlayerCeremony.playerName}</div>
              <div className="dice-winner-status">
                {firstPlayerCeremony.isMe
                  ? '🎉 BẠN ĐƯỢC CHỌN ĐI TRƯỚC!'
                  : '🎲 ĐƯỢC CHỌN ĐI TRƯỚC!'}
              </div>
            </div>

            <button
              className="btn-confirm-ceremony"
              onClick={() => setFirstPlayerCeremony(null)}
            >
              Vào Bàn Chơi ➔
            </button>
          </div>
        </div>
      )}

      {/* MAIN 3D STEAM ARENA STADIUM */}
      <main className={`steam-stadium-arena ${totalPlayers > 4 ? "many-players" : ""}`}>
        {/* OPPONENT PODS AROUND THE TABLE */}
        {relativeOpponents.map(({ player: opp, seat }) => {
          const isOppTurn = currentPlayer?.id === opp.id;
          const hasOneCard = opp.cards.length === 1;
          const isMissedUno = hasOneCard && !opp.unoCalled;

          return (
            <div
              key={opp.id}
              className={`steam-seat-pod seat-${seat} ${isOppTurn ? 'active-turn' : ''} ${
                isMissedUno ? 'uncalled-danger' : ''
              }`}
            >
              {/* Turn Spotlight Cone */}
              {isOppTurn && <div className="seat-spotlight-cone" />}

              <div className="seat-pod-card">
                {/* Avatar with dynamic glow ring */}
                <div className="avatar-pod-wrapper">
                  <div className={`avatar-frame ${isOppTurn ? 'ring-active-glow' : ''}`}>
                    {opp.avatar ? (
                      <span className="avatar-emoji">{opp.avatar}</span>
                    ) : (
                      <span className="avatar-letter">{opp.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {opp.unoCalled && <span className="seat-uno-pill safe">🔥 UNO!</span>}
                  {isMissedUno && (
                    <span className="seat-uno-pill danger pulse">⚠️ 1 LÁ!</span>
                  )}
                </div>

                {/* Player details */}
                <div className="seat-details">
                  <div className="seat-name-row">
                    <span className="seat-player-name">{opp.name}</span>
                    {opp.name.includes('Bot') && <span className="bot-pill-tag">AI</span>}
                  </div>
                  <div className="seat-card-fan-row">
                    <div className="mini-card-fan">
                      <div className="mini-card-back c1" />
                      <div className="mini-card-back c2" />
                      <div className="mini-card-back c3" />
                    </div>
                    <span className="seat-card-count">
                      {opp.cards.length} {opp.cards.length === 1 ? 'lá' : 'lá bài'}
                    </span>
                  </div>
                </div>

                {/* Quick Catch Button on seat */}
                {isMissedUno && (
                  <button
                    className="btn-seat-catch pulse"
                    onClick={() => handleCatchUno(opp.id)}
                    title="Bắt đối thủ này vì quên hô UNO! Phạt rút 2 lá."
                  >
                    🚨 Bắt Bài!
                  </button>
                )}

                {/* Thinking animation indicator */}
                {isOppTurn && (
                  <div className="seat-thinking-bar">
                    <span className="think-dot d1" />
                    <span className="think-dot d2" />
                    <span className="think-dot d3" />
                    <span className="think-text">Đang nghĩ...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 3D OVAL FELT TABLE WITH DIRECTION TRACK */}
        <div
          className="steam-oval-table"
          style={{
            borderColor: currentColorInfo.bg,
            boxShadow: `inset 0 0 70px rgba(0, 0, 0, 0.85), 0 0 50px ${currentColorInfo.glow}, 0 25px 50px rgba(0, 0, 0, 0.7)`,
          }}
        >
          {/* Circulating Directional Track */}
          <div
            className={`steam-track-orbit ${
              gameState.direction === 1 ? 'clockwise' : 'counter-clockwise'
            }`}
          >
            {/* SVG Track line */}
            <svg className="track-svg-elem" viewBox="0 0 540 290" preserveAspectRatio="none">
              <ellipse cx="270" cy="145" rx="250" ry="125" className="track-svg-bg" />
              <ellipse
                cx="270"
                cy="145"
                rx="250"
                ry="125"
                className="track-svg-neon"
                style={{ stroke: currentColorInfo.bg }}
              />
            </svg>

            {/* Neon Direction Chevrons */}
            <div className="orbit-chevron top-chevron">
              {gameState.direction === 1 ? '▶ ▶ ▶ ▶' : '◀ ◀ ◀ ◀'}
            </div>
            <div className="orbit-chevron right-chevron">
              {gameState.direction === 1 ? '▼' : '▲'}
            </div>
            <div className="orbit-chevron bottom-chevron">
              {gameState.direction === 1 ? '◀ ◀ ◀ ◀' : '▶ ▶ ▶ ▶'}
            </div>
            <div className="orbit-chevron left-chevron">
              {gameState.direction === 1 ? '▲' : '▼'}
            </div>
          </div>

          {/* Table Center Pedestals */}
          <div className="table-center-content">
            {/* DRAW PILE WITH 3D DEPTH */}
            <div className="pile-station draw-pile-station">
              <span className="pile-label">XẤP BÀI RÚT</span>
              <div
                className={`deck-stack-3d ${isMyTurn ? 'can-draw' : ''}`}
                onClick={handleDrawCard}
                title={isMyTurn ? 'Click để rút bài' : 'Chờ đến lượt của bạn'}
              >
                <div className="deck-thickness layer-3" />
                <div className="deck-thickness layer-2" />
                <div className="deck-thickness layer-1" />
                <Card faceDown size="lg" isPlayable={isMyTurn} skin={mySkin} />
                <span className="deck-counter-badge">{gameState.deck.length} lá</span>
              </div>
              {isMyTurn && (
                <button
                  className="btn-table-draw pulse-glow"
                  onClick={handleDrawCard}
                >
                  📥 Rút Bài (+1)
                </button>
              )}
            </div>

            {/* RADIANT ACTIVE COLOR GEM */}
            <div className="pile-station color-gem-station">
              <div
                className="color-gem-crystal"
                style={{
                  backgroundColor: currentColorInfo.bg,
                  boxShadow: `0 0 35px ${currentColorInfo.bg}, 0 0 70px ${currentColorInfo.glow}, inset 0 2px 8px rgba(255, 255, 255, 0.8)`,
                }}
              >
                <span className="gem-shimmer">✨</span>
              </div>
              <span className="gem-color-name" style={{ color: currentColorInfo.bg }}>
                Màu: <strong>{currentColorInfo.name}</strong>
              </span>
              <span className="direction-mode-pill">
                {gameState.direction === 1 ? '↻ Thuận chiều' : '↺ Đảo ngược'}
              </span>
            </div>

            {/* DISCARD PILE WITH PEDESTAL */}
            <div className="pile-station discard-pile-station">
              <span className="pile-label">BÀI ĐANG ĐÁNH</span>
              <div className="discard-pedestal-rim">
                {topCard ? (
                  <Card card={topCard} size="lg" />
                ) : (
                  <div className="empty-discard-slot">Chưa có bài</div>
                )}
              </div>
              {topCard && (
                <span className="topcard-effect-tag">
                  {topCard.value === 'skip' && '⛔ BỎ LƯỢT'}
                  {topCard.value === 'reverse' && '🔄 ĐỔI CHIỀU'}
                  {topCard.value === 'draw2' && '💥 PHẠT +2 LÁ'}
                  {topCard.value === 'wild_draw4' && '🔥 PHẠT +4 LÁ'}
                  {topCard.value === 'wild' && '🌈 ĐỔI MÀU'}
                  {typeof topCard.value === 'number' && `Số ${topCard.value}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* STEAM ACTION CONTROLS & HAND */}
      <footer className="steam-footer">
        {/* Steam 3D Buttons & Chat Bar */}
        <div className="steam-action-bar">
          {/* User station pod at bottom */}
          <div className={`user-identity-pod ${isMyTurn ? 'user-turn-active' : ''}`}>
            <div className="user-avatar-disc">
              {myPlayerState?.avatar || '🧑'}
            </div>
            <div className="user-details">
              <span className="user-name-tag">{playerName} (Bạn)</span>
              <span className="user-cards-tag">🃏 {myCards.length} lá bài</span>
            </div>
            {isMyTurn && <span className="your-turn-chip">👉 LƯỢT BẠN</span>}
          </div>

          {/* STEAM 3D UNO BUTTON */}
          <button
            className={`steam-btn-uno ${
              isMyUnoUrgent
                ? 'urgent-pulse flame-shake'
                : myCards.length <= 2 && !myPlayerState?.unoCalled
                ? 'ready-pulse'
                : ''
            } ${myPlayerState?.unoCalled ? 'called-safe' : ''}`}
            onClick={handleCallUno}
            disabled={myPlayerState?.unoCalled || myCards.length > 2}
            title="Hô UNO khi còn 1 hoặc 2 lá bài (Phím tắt: U)"
          >
            <div className="btn-uno-content">
              <span className="uno-flame-icon">{myPlayerState?.unoCalled ? '🛡️' : '🔥'}</span>
              <div className="uno-text-stack">
                <span className="uno-title-text">
                  {myPlayerState?.unoCalled
                    ? 'ĐÃ HÔ UNO!'
                    : isMyUnoUrgent
                    ? 'HÔ UNO NGAY!'
                    : 'HÔ UNO!'}
                </span>
                <span className="uno-sub-hint">Phím [U]</span>
              </div>
            </div>
          </button>

          {/* STEAM 3D CATCH BUTTON */}
          <button
            className={`steam-btn-catch ${canCatchSomeone ? 'active-siren pulse' : 'dormant'}`}
            onClick={() => handleCatchUno()}
            title="Bắt đối thủ quên hô UNO khi họ còn 1 lá (Phím tắt: B hoặc C)"
          >
            <div className="btn-catch-content">
              <span className="catch-siren-icon">{canCatchSomeone ? '🚨' : '🛡️'}</span>
              <div className="catch-text-stack">
                <span className="catch-title-text">BẮT BÀI UNO!</span>
                <span className="catch-sub-hint">
                  {canCatchSomeone ? `${uncalledCount} người quên! [B]` : 'Phím [B]'}
                </span>
              </div>
            </div>
          </button>

          {/* COMMAND FORM & CHAT */}
          <form className="steam-command-form" onSubmit={handleCommandSubmit}>
            <div className="steam-quick-chips">
              <button
                type="button"
                className="chip-btn"
                onClick={handleCallUno}
                title="Lệnh nhanh hô UNO"
              >
                /uno
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => handleCatchUno()}
                title="Lệnh nhanh bắt bài"
              >
                /bat
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={handleDrawCard}
                title="Lệnh nhanh rút bài"
              >
                /rut
              </button>
            </div>
            <input
              type="text"
              className="steam-command-input"
              placeholder="Lệnh /uno, /bat hoặc chat..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={60}
            />
            <button type="submit" className="steam-submit-btn">
              Gửi
            </button>
          </form>
        </div>

        {/* FANNED HAND OF CARDS */}
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
            socket.emit(SOCKET_EVENTS.ROOM_SET_THEME, { theme: th });
          }
        }}
        onCosmeticsChange={(up) => {
          setCosmetics(up);
          socket.emit(SOCKET_EVENTS.PLAYER_UPDATE_COSMETICS, {
            avatar: up.avatar,
            cardSkin: up.cardSkin,
          });
        }}
      />

      {/* GAME OVER MODAL */}
      {gameState.status === 'ended' && (
        <div className="game-over-overlay">
          <div className="game-over-modal animate-pop">
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
                    {p.cards.length === 0 ? '🏆 Về Nhất' : `Còn ${p.cards.length} lá bài`}
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
                  Quay Lại Phòng Chờ
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
        .steam-gameboard-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #f8fafc;
          overflow-x: hidden;
          position: relative;
          transition: background 0.4s ease;
          user-select: none;
        }

        .confetti-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
        }

        /* STEAM HEADER */
        .steam-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 1.5rem;
          background: rgba(10, 15, 30, 0.85);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          z-index: 50;
        }

        .steam-header-left,
        .steam-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .steam-badge-room {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border: 1px solid rgba(129, 140, 248, 0.4);
          border-radius: 8px;
          overflow: hidden;
          font-size: 0.85rem;
        }

        .steam-badge-room .badge-label {
          background: #4338ca;
          color: #e0e7ff;
          padding: 0.25rem 0.5rem;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .steam-badge-room .badge-val {
          color: #ffffff;
          padding: 0.25rem 0.65rem;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .steam-theme-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.07);
          color: #cbd5e1;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .steam-turn-pill {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .steam-turn-announcer {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .announcer-tag.my-turn {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #78350f;
          padding: 0.45rem 1.6rem;
          border-radius: 9999px;
          font-weight: 900;
          font-size: 0.95rem;
          border: 2px solid #fef08a;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: steamTurnBounce 1.4s infinite;
        }

        .announcer-tag.waiting-turn {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          padding: 0.4rem 1.2rem;
          border-radius: 9999px;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .steam-nav-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f1f5f9;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .steam-nav-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }

        .steam-nav-btn.leave:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: #ef4444;
          color: #fca5a5;
        }

        /* FIRST PLAYER CEREMONY OVERLAY */
        .first-player-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 10, 25, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s ease-out;
        }

        .first-player-card {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid #fbbf24;
          box-shadow: 0 0 50px rgba(251, 191, 36, 0.5), 0 20px 40px rgba(0, 0, 0, 0.8);
          border-radius: 24px;
          padding: 2.25rem 3rem;
          text-align: center;
          max-width: 480px;
          width: 90%;
        }

        .dice-roll-icon-wrap {
          font-size: 4rem;
          margin-bottom: 0.5rem;
          animation: diceSpin 1.2s ease-out;
        }

        .dice-ceremony-title {
          font-size: 1.4rem;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .dice-ceremony-sub {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .dice-winner-card {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .dice-winner-avatar {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .dice-winner-name {
          font-size: 1.5rem;
          font-weight: 900;
          color: #fef08a;
          margin-bottom: 0.25rem;
        }

        .dice-winner-status {
          font-weight: 800;
          font-size: 0.95rem;
          color: #fbbf24;
        }

        .btn-confirm-ceremony {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          font-weight: 900;
          font-size: 1.05rem;
          border: none;
          padding: 0.8rem 2.2rem;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-confirm-ceremony:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.6);
        }

        /* 3D STEAM STADIUM ARENA */
        .steam-stadium-arena {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 1.5rem 2rem;
          min-height: 480px;
        }

        /* SEAT PODS */
        .steam-seat-pod {
          position: absolute;
          z-index: 20;
          transition: all 0.3s ease;
        }

        .steam-seat-pod.seat-top {
          top: 0.8rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .steam-seat-pod.seat-left {
          left: 1.5rem;
          top: 48%;
          transform: translateY(-50%);
        }

        .steam-seat-pod.seat-left-top {
          left: 1.5rem;
          top: 12%;
        }

        .steam-seat-pod.seat-left-bottom {
          left: 1.5rem;
          bottom: 12%;
        }

        .steam-seat-pod.seat-right {
          right: 1.5rem;
          top: 48%;
          transform: translateY(-50%);
        }

        .steam-seat-pod.seat-right-top {
          right: 1.5rem;
          top: 12%;
        }

        .steam-seat-pod.seat-right-bottom {
          right: 1.5rem;
          bottom: 12%;
        }

        .steam-seat-pod.seat-top-left {
          top: 1rem;
          left: 20%;
        }

        .steam-seat-pod.seat-top-right {
          top: 1rem;
          right: 20%;
        }

        /* Compact sizing for 5 to 10 player matches */
        .many-players .seat-pod-card {
          padding: 0.45rem 0.65rem;
          min-width: 145px;
          gap: 0.5rem;
          border-radius: 12px;
        }

        .many-players .avatar-frame {
          width: 38px;
          height: 38px;
          font-size: 1.25rem;
        }

        .many-players .seat-player-name {
          max-width: 75px;
          font-size: 0.82rem;
        }

        .many-players .seat-card-count {
          font-size: 0.72rem;
        }

        /* Seat spotlight cone */
        .seat-spotlight-cone {
          position: absolute;
          inset: -30px;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: spotlightPulse 2s infinite ease-in-out;
          z-index: -1;
        }

        .seat-pod-card {
          background: rgba(15, 23, 42, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          min-width: 190px;
          position: relative;
        }

        .steam-seat-pod.active-turn .seat-pod-card {
          border-color: #fbbf24;
          box-shadow: 0 0 25px rgba(251, 191, 36, 0.5);
          background: rgba(30, 41, 59, 0.95);
        }

        .steam-seat-pod.uncalled-danger .seat-pod-card {
          border-color: #ef4444;
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.7);
          animation: dangerShake 1.5s infinite;
        }

        .avatar-pod-wrapper {
          position: relative;
        }

        .avatar-frame {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          transition: all 0.2s;
        }

        .avatar-frame.ring-active-glow {
          border-color: #fbbf24;
          box-shadow: 0 0 15px #fbbf24;
        }

        .seat-uno-pill {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.68rem;
          font-weight: 900;
          padding: 0.12rem 0.45rem;
          border-radius: 999px;
          white-space: nowrap;
        }

        .seat-uno-pill.safe {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.5);
        }

        .seat-uno-pill.danger {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.8);
        }

        .seat-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .seat-name-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .seat-player-name {
          font-weight: 800;
          font-size: 0.92rem;
          color: #f1f5f9;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bot-pill-tag {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #f0f9ff;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }

        .seat-card-fan-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mini-card-fan {
          display: flex;
          align-items: center;
        }

        .mini-card-back {
          width: 12px;
          height: 18px;
          border-radius: 2px;
          background: linear-gradient(135deg, #c80036 0%, #800020 100%);
          border: 1px solid #ffffff;
          margin-left: -6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .mini-card-back.c1 { margin-left: 0; transform: rotate(-8deg); }
        .mini-card-back.c2 { transform: rotate(0deg); }
        .mini-card-back.c3 { transform: rotate(8deg); }

        .seat-card-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: #cbd5e1;
        }

        .btn-seat-catch {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          border: none;
          font-weight: 900;
          font-size: 0.75rem;
          padding: 0.35rem 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
        }

        .seat-thinking-bar {
          position: absolute;
          bottom: -22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: rgba(15, 23, 42, 0.9);
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
          color: #fbbf24;
          font-weight: 700;
          border: 1px solid rgba(251, 191, 36, 0.4);
          white-space: nowrap;
        }

        .think-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #fbbf24;
          animation: thinkBounce 1.2s infinite;
        }
        .think-dot.d2 { animation-delay: 0.2s; }
        .think-dot.d3 { animation-delay: 0.4s; }

        /* THE 3D STEAM OVAL FELT TABLE */
        .steam-oval-table {
          width: 620px;
          height: 330px;
          border-radius: 200px / 120px;
          background: radial-gradient(ellipse at center, #0f3d2e 0%, #06241b 60%, #02120d 100%);
          border: 10px solid #27272a;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }

        /* DIRECTION TRACK ORBIT */
        .steam-track-orbit {
          position: absolute;
          inset: 8px;
          pointer-events: none;
        }

        .track-svg-elem {
          width: 100%;
          height: 100%;
        }

        .track-svg-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 4;
        }

        .track-svg-neon {
          fill: none;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-dasharray: 24 16;
          filter: drop-shadow(0 0 8px currentColor);
        }

        .steam-track-orbit.clockwise .track-svg-neon {
          animation: orbitClockwise 8s linear infinite;
        }

        .steam-track-orbit.counter-clockwise .track-svg-neon {
          animation: orbitCounterClockwise 8s linear infinite;
        }

        .orbit-chevron {
          position: absolute;
          font-size: 0.85rem;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          letter-spacing: 0.2em;
        }

        .top-chevron {
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
        }

        .bottom-chevron {
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
        }

        .left-chevron {
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
        }

        .right-chevron {
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* TABLE CENTER CONTENT */
        .table-center-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          z-index: 10;
        }

        .pile-station {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .pile-label {
          font-weight: 800;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: #94a3b8;
          text-transform: uppercase;
        }

        /* 3D DRAW STACK */
        .deck-stack-3d {
          position: relative;
          cursor: default;
          transition: transform 0.2s;
        }

        .deck-stack-3d.can-draw {
          cursor: pointer;
        }

        .deck-stack-3d.can-draw:hover {
          transform: translateY(-6px) scale(1.05);
        }

        .deck-thickness {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #3b0764;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
        }

        .deck-thickness.layer-3 {
          top: 6px;
          left: 6px;
          background: #1e1b4b;
        }

        .deck-thickness.layer-2 {
          top: 4px;
          left: 4px;
          background: #312e81;
        }

        .deck-thickness.layer-1 {
          top: 2px;
          left: 2px;
          background: #4338ca;
        }

        .deck-counter-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          backdrop-filter: blur(4px);
        }

        .btn-table-draw {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #78350f;
          font-weight: 900;
          font-size: 0.8rem;
          border: none;
          padding: 0.35rem 0.9rem;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        /* COLOR GEM STATION */
        .color-gem-station {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .color-gem-crystal {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: gemFloat 3s infinite ease-in-out;
        }

        .gem-shimmer {
          font-size: 1.25rem;
          filter: drop-shadow(0 0 6px #ffffff);
        }

        .gem-color-name {
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .direction-mode-pill {
          font-size: 0.72rem;
          font-weight: 700;
          color: #cbd5e1;
          background: rgba(0, 0, 0, 0.4);
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* DISCARD PILE STATION */
        .discard-pedestal-rim {
          padding: 6px;
          background: rgba(0, 0, 0, 0.45);
          border-radius: 16px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }

        .empty-discard-slot {
          width: 90px;
          height: 135px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .topcard-effect-tag {
          font-size: 0.75rem;
          font-weight: 900;
          color: #f1f5f9;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        /* STEAM FOOTER */
        .steam-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(180deg, transparent 0%, rgba(10, 15, 30, 0.95) 30%);
          padding: 0.5rem 1.5rem 1rem;
          z-index: 40;
        }

        .steam-action-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          margin-bottom: 0.6rem;
          flex-wrap: wrap;
          width: 100%;
          max-width: 1100px;
        }

        /* User Identity Pod at Bottom */
        .user-identity-pod {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.4rem 0.9rem;
          border-radius: 12px;
        }

        .user-identity-pod.user-turn-active {
          border-color: #fbbf24;
          box-shadow: 0 0 16px rgba(251, 191, 36, 0.4);
        }

        .user-avatar-disc {
          font-size: 1.5rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name-tag {
          font-weight: 800;
          font-size: 0.85rem;
          color: #f8fafc;
        }

        .user-cards-tag {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 700;
        }

        .your-turn-chip {
          background: #fbbf24;
          color: #78350f;
          font-weight: 900;
          font-size: 0.75rem;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          animation: bounce 1.2s infinite;
        }

        /* STEAM 3D UNO BUTTON */
        .steam-btn-uno {
          position: relative;
          background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
          border: 2px solid #fca5a5;
          border-bottom: 6px solid #7f1d1d;
          border-radius: 14px;
          color: #ffffff;
          padding: 0.45rem 1.4rem;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
          transition: transform 0.1s, border-bottom 0.1s, box-shadow 0.1s;
        }

        .steam-btn-uno:active:not(:disabled) {
          transform: translateY(4px);
          border-bottom: 2px solid #7f1d1d;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
        }

        .steam-btn-uno:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }

        .steam-btn-uno.called-safe {
          background: linear-gradient(180deg, #10b981 0%, #047857 100%);
          border-color: #a7f3d0;
          border-bottom-color: #064e3b;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
          opacity: 0.9;
        }

        .btn-uno-content {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .uno-flame-icon {
          font-size: 1.5rem;
        }

        .uno-text-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .uno-title-text {
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .uno-sub-hint {
          font-size: 0.65rem;
          opacity: 0.85;
          font-weight: 700;
        }

        /* STEAM 3D CATCH BUTTON */
        .steam-btn-catch {
          position: relative;
          background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-bottom: 6px solid #0f172a;
          border-radius: 14px;
          color: #f1f5f9;
          padding: 0.45rem 1.4rem;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
          transition: transform 0.1s, border-bottom 0.1s, box-shadow 0.1s;
        }

        .steam-btn-catch:active {
          transform: translateY(4px);
          border-bottom: 2px solid #0f172a;
        }

        .steam-btn-catch.active-siren {
          background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
          border-color: #fef08a;
          border-bottom-color: #92400e;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.6);
        }

        .btn-catch-content {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .catch-siren-icon {
          font-size: 1.5rem;
        }

        .catch-text-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .catch-title-text {
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .catch-sub-hint {
          font-size: 0.65rem;
          opacity: 0.85;
          font-weight: 700;
        }

        /* COMMAND FORM & CHAT */
        .steam-command-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 0.25rem 0.5rem;
        }

        .steam-quick-chips {
          display: flex;
          gap: 0.3rem;
        }

        .chip-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.45rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .chip-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
        }

        .steam-command-input {
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 0.85rem;
          padding: 0.35rem 0.5rem;
          width: 170px;
        }

        .steam-command-input::placeholder {
          color: #64748b;
        }

        .steam-submit-btn {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          color: white;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
        }

        /* TOAST & ALERTS */
        .steam-action-alert {
          position: fixed;
          top: 75px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid #fbbf24;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(251, 191, 36, 0.4);
          border-radius: 14px;
          padding: 0.75rem 1.6rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          z-index: 100;
          animation: slideDown 0.25s ease-out;
        }

        .alert-emoji {
          font-size: 1.8rem;
        }

        .alert-title {
          font-size: 0.95rem;
          font-weight: 900;
          color: #fef08a;
          margin: 0;
        }

        .alert-desc {
          font-size: 0.82rem;
          color: #e2e8f0;
          margin: 0;
        }

        .steam-uno-toast {
          position: fixed;
          top: 130px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          color: white;
          font-size: 1.25rem;
          font-weight: 900;
          padding: 0.6rem 2.2rem;
          border-radius: 999px;
          box-shadow: 0 0 35px rgba(239, 68, 68, 0.8);
          border: 2px solid #ffffff;
          z-index: 100;
          animation: steamTurnBounce 0.8s infinite;
        }

        /* GAME OVER MODAL */
        .game-over-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 10, 25, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .game-over-modal {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid #fbbf24;
          border-radius: 24px;
          padding: 2.5rem;
          text-align: center;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 50px rgba(251, 191, 36, 0.3);
        }

        .trophy-icon {
          font-size: 4rem;
          margin-bottom: 0.5rem;
          animation: bounce 1.5s infinite;
        }

        .game-over-modal h2 {
          font-size: 1.8rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .winner-announce {
          font-size: 1.1rem;
          color: #cbd5e1;
          margin-bottom: 1.5rem;
        }

        .you-won {
          color: #fef08a;
          font-weight: 900;
          font-size: 1.25rem;
        }

        .final-players-list {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .final-player-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .game-over-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        /* ANIMATIONS */
        @keyframes orbitClockwise {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -200; }
        }

        @keyframes orbitCounterClockwise {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 200; }
        }

        @keyframes spotlightPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.1); }
        }

        @keyframes gemFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes steamTurnBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes diceSpin {
          0% { transform: rotate(0deg) scale(0.3); opacity: 0; }
          60% { transform: rotate(360deg) scale(1.2); }
          100% { transform: rotate(720deg) scale(1); opacity: 1; }
        }

        @keyframes dangerShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }

        @keyframes flameShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }

        @keyframes thinkBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-pop {
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }

        .pulse-glow {
          animation: pulseGlow 1.5s infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 0 25px rgba(251, 191, 36, 0.8); }
        }

        /* RESPONSIVE LAYOUT */
        @media (max-width: 900px) {
          .steam-oval-table {
            width: 90vw;
            height: 280px;
          }
          .steam-seat-pod.seat-left {
            left: 0.5rem;
          }
          .steam-seat-pod.seat-right {
            right: 0.5rem;
          }
          .table-center-content {
            gap: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
