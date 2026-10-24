import type { Card as CardType, CardColor } from '@uno/shared';
import { CARD_SKINS } from '../cosmetics';

interface CardProps {
  card?: CardType;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  selected?: boolean;
  skin?: string;
}

const COLOR_MAP: Record<CardColor, { bg: string; border: string; glow: string }> = {
  red: { bg: '#e11d48', border: '#be123c', glow: 'rgba(225, 29, 72, 0.6)' },
  blue: { bg: '#2563eb', border: '#1d4ed8', glow: 'rgba(37, 99, 235, 0.6)' },
  green: { bg: '#059669', border: '#047857', glow: 'rgba(5, 150, 105, 0.6)' },
  yellow: { bg: '#d97706', border: '#b45309', glow: 'rgba(217, 119, 6, 0.6)' },
  black: { bg: '#18181b', border: '#3f3f46', glow: 'rgba(251, 191, 36, 0.6)' },
};

export default function Card({
  card,
  isPlayable = false,
  onClick,
  size = 'md',
  faceDown = false,
  selected = false,
  skin = 'classic',
}: CardProps) {
  const activeSkin = CARD_SKINS.find((s) => s.id === skin) || CARD_SKINS[0];

  if (faceDown || !card) {
    return (
      <div
        className={`uno-card face-down skin-${activeSkin.id} size-${size} ${
          onClick ? 'clickable' : ''
        }`}
        onClick={onClick}
        style={{
          borderColor: activeSkin.border,
        }}
      >
        <div
          className="card-back-pattern"
          style={{
            backgroundColor: activeSkin.bg,
            borderColor: activeSkin.border,
          }}
        >
          <span className="uno-back-logo">UNO</span>
        </div>
        <div className="card-sheen" />
        <style>{cardStyles}</style>
      </div>
    );
  }

  const { color, value } = card;
  const colorStyle = COLOR_MAP[color];

  const renderSymbol = (val: string) => {
    switch (val) {
      case 'skip':
        return '⊘';
      case 'reverse':
        return '⇄';
      case 'draw2':
        return '+2';
      case 'wild':
        return '★';
      case 'wild_draw4':
        return '+4';
      default:
        return val;
    }
  };

  const symbol = renderSymbol(value);

  return (
    <div
      className={`uno-card color-${color} size-${size} ${isPlayable ? 'playable' : ''} ${
        selected ? 'selected' : ''
      } ${onClick && isPlayable ? 'clickable' : ''}`}
      onClick={isPlayable ? onClick : undefined}
      style={{
        backgroundColor: colorStyle.bg,
        borderColor: isPlayable ? '#fbbf24' : colorStyle.border,
      }}
    >
      {/* 3D Glass Sheen reflection */}
      <div className="card-sheen" />

      {/* Corner indicator: top-left */}
      <div className="corner corner-tl">
        <span>{symbol}</span>
      </div>

      {/* Center oval */}
      <div className={`center-oval ${color === 'black' ? 'wild-oval' : ''}`}>
        {color === 'black' ? (
          <div className="wild-badge">
            <div className="wild-quadrant q-red" />
            <div className="wild-quadrant q-blue" />
            <div className="wild-quadrant q-yellow" />
            <div className="wild-quadrant q-green" />
            <span className="wild-symbol">{symbol}</span>
          </div>
        ) : (
          <span className="center-value" style={{ color: colorStyle.bg }}>
            {symbol}
          </span>
        )}
      </div>

      {/* Corner indicator: bottom-right */}
      <div className="corner corner-br">
        <span>{symbol}</span>
      </div>

      <style>{cardStyles}</style>
    </div>
  );
}

const cardStyles = `
  .uno-card {
    position: relative;
    border-radius: 14px;
    border: 3px solid;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
    overflow: hidden;
  }

  .card-sheen {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 45%, transparent 60%);
    pointer-events: none;
    border-radius: 11px;
    z-index: 5;
  }

  .size-sm {
    width: 50px;
    height: 75px;
    border-radius: 8px;
  }
  .size-md {
    width: 82px;
    height: 124px;
  }
  .size-lg {
    width: 108px;
    height: 162px;
  }

  .uno-card.clickable {
    cursor: pointer;
  }

  .uno-card.playable {
    cursor: pointer;
    box-shadow: 0 0 18px rgba(251, 191, 36, 0.9), 0 4px 12px rgba(0, 0, 0, 0.4);
    border-color: #fbbf24 !important;
    animation: playableGlow 2s infinite alternate;
  }

  .uno-card.playable:hover {
    transform: translateY(-16px) scale(1.08) rotate(1deg);
    box-shadow: 0 14px 28px rgba(251, 191, 36, 1), 0 6px 16px rgba(0, 0, 0, 0.5);
    border-color: #ffffff !important;
    z-index: 25;
  }

  .uno-card.selected {
    transform: translateY(-20px) scale(1.1) rotate(-1deg);
    box-shadow: 0 16px 32px rgba(251, 191, 36, 1);
    border-color: #ffffff !important;
    z-index: 30;
  }

  .uno-card.face-down {
    background: #0f172a;
    border-color: #334155;
  }

  .uno-card.skin-cyber {
    background: #022c43;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  }

  .uno-card.skin-luxury {
    background: #271a00;
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
  }

  .uno-card.skin-obsidian {
    background: #09090b;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
  }

  .uno-card.skin-galaxy {
    background: #2e0854;
    box-shadow: 0 0 14px rgba(192, 132, 252, 0.5);
  }

  .card-back-pattern {
    width: 84%;
    height: 84%;
    border: 2px solid #ffffff;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-15deg);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
  }

  .uno-back-logo {
    color: #fbbf24;
    font-weight: 900;
    font-size: 1.25rem;
    font-style: italic;
    letter-spacing: -0.05em;
    text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
  }

  .corner {
    position: absolute;
    color: #ffffff;
    font-weight: 900;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
    z-index: 6;
  }

  .size-sm .corner { font-size: 0.7rem; }
  .size-lg .corner { font-size: 1.25rem; }

  .corner-tl {
    top: 6px;
    left: 8px;
  }

  .corner-br {
    bottom: 6px;
    right: 8px;
    transform: rotate(180deg);
  }

  .center-oval {
    width: 74%;
    height: 74%;
    background: #ffffff;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    transform: rotate(-25deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 4;
  }

  .center-value {
    font-weight: 900;
    font-size: 2.3rem;
    font-style: italic;
    transform: rotate(25deg);
    text-shadow: 1px 1px 0 rgba(0,0,0,0.2);
  }

  .size-sm .center-value { font-size: 1.35rem; }
  .size-lg .center-value { font-size: 3.2rem; }

  .wild-badge {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    overflow: hidden;
  }

  .wild-quadrant.q-red { background: #e11d48; }
  .wild-quadrant.q-blue { background: #2563eb; }
  .wild-quadrant.q-yellow { background: #d97706; }
  .wild-quadrant.q-green { background: #059669; }

  .wild-symbol {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 900;
    font-size: 1.7rem;
    font-style: italic;
    transform: rotate(25deg);
    text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.85);
  }

  @keyframes playableGlow {
    from {
      box-shadow: 0 0 12px rgba(251, 191, 36, 0.7);
    }
    to {
      box-shadow: 0 0 22px rgba(251, 191, 36, 1), 0 0 6px #ffffff;
    }
  }
`;
