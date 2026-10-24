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

const COLOR_MAP: Record<CardColor, { bg: string; border: string; glow: string; text: string }> = {
  red: {
    bg: 'linear-gradient(145deg, #ff2a5f 0%, #c80036 100%)',
    border: '#ffe4e6',
    glow: 'rgba(255, 42, 95, 0.65)',
    text: '#c80036',
  },
  blue: {
    bg: 'linear-gradient(145deg, #3b82f6 0%, #1d4ed8 100%)',
    border: '#dbeafe',
    glow: 'rgba(59, 130, 246, 0.65)',
    text: '#1d4ed8',
  },
  green: {
    bg: 'linear-gradient(145deg, #10b981 0%, #047857 100%)',
    border: '#d1fae5',
    glow: 'rgba(16, 185, 129, 0.65)',
    text: '#047857',
  },
  yellow: {
    bg: 'linear-gradient(145deg, #f59e0b 0%, #b45309 100%)',
    border: '#fef3c7',
    glow: 'rgba(245, 158, 11, 0.65)',
    text: '#b45309',
  },
  black: {
    bg: 'linear-gradient(145deg, #27272a 0%, #09090b 100%)',
    border: '#fef08a',
    glow: 'rgba(251, 191, 36, 0.65)',
    text: '#18181b',
  },
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
            background: activeSkin.bg,
            borderColor: activeSkin.border,
          }}
        >
          <div className="card-back-inner-glow" />
          <span className="uno-back-logo">UNO</span>
        </div>
        <div className="card-glass-glare" />
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
        background: colorStyle.bg,
      }}
    >
      {/* Dynamic Glass Glare Sheen */}
      <div className="card-glass-glare" />

      {/* Subtle Inner Border Line */}
      <div className="card-inner-rim" />

      {/* Corner indicator: top-left */}
      <div className="corner corner-tl">
        <span>{symbol}</span>
      </div>

      {/* Center oval badge */}
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
          <span className="center-value" style={{ color: colorStyle.text }}>
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
    border-radius: 16px;
    border: 3.5px solid rgba(255, 255, 255, 0.85);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, border-color 0.2s ease;
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
    overflow: hidden;
  }

  .card-inner-rim {
    position: absolute;
    inset: 4px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 11px;
    pointer-events: none;
    z-index: 2;
  }

  .card-glass-glare {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0.12) 35%,
      transparent 55%
    );
    pointer-events: none;
    z-index: 8;
  }

  .size-sm {
    width: 52px;
    height: 78px;
    border-radius: 10px;
    border-width: 2.5px;
  }
  .size-md {
    width: 86px;
    height: 130px;
  }
  .size-lg {
    width: 114px;
    height: 172px;
  }

  .uno-card.clickable {
    cursor: pointer;
  }

  .uno-card.playable {
    cursor: pointer;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.9), 0 8px 18px rgba(0, 0, 0, 0.4);
    border-color: #fbbf24 !important;
    animation: playablePulse 1.8s infinite alternate;
  }

  .uno-card.playable:hover {
    transform: translateY(-18px) scale(1.08) rotate(1deg);
    box-shadow: 0 16px 34px rgba(251, 191, 36, 1), 0 0 10px #ffffff;
    border-color: #ffffff !important;
    z-index: 30;
  }

  .uno-card.selected {
    transform: translateY(-24px) scale(1.12);
    box-shadow: 0 20px 40px rgba(251, 191, 36, 1);
    border-color: #ffffff !important;
    z-index: 35;
  }

  .uno-card.face-down {
    background: #090d16;
    border-color: #334155;
  }

  .uno-card.skin-cyber {
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.5), 0 8px 18px rgba(0, 0, 0, 0.5);
  }

  .uno-card.skin-luxury {
    box-shadow: 0 0 16px rgba(251, 191, 36, 0.5), 0 8px 18px rgba(0, 0, 0, 0.5);
  }

  .uno-card.skin-obsidian {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.9);
  }

  .uno-card.skin-galaxy {
    box-shadow: 0 0 18px rgba(192, 132, 252, 0.6), 0 8px 18px rgba(0, 0, 0, 0.5);
  }

  .card-back-pattern {
    width: 84%;
    height: 84%;
    border: 2.5px solid rgba(255, 255, 255, 0.85);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-15deg);
    box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.45), 0 3px 8px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }

  .card-back-inner-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  }

  .uno-back-logo {
    color: #fbbf24;
    font-weight: 900;
    font-size: 1.4rem;
    font-style: italic;
    letter-spacing: -0.05em;
    text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 0 0 10px rgba(251, 191, 36, 0.8);
    position: relative;
    z-index: 2;
  }

  .corner {
    position: absolute;
    color: #ffffff;
    font-weight: 900;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
    z-index: 6;
  }

  .size-sm .corner { font-size: 0.75rem; }
  .size-lg .corner { font-size: 1.35rem; }

  .corner-tl {
    top: 7px;
    left: 8px;
  }

  .corner-br {
    bottom: 7px;
    right: 8px;
    transform: rotate(180deg);
  }

  .center-oval {
    width: 74%;
    height: 74%;
    background: #ffffff;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    transform: rotate(-24deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.2);
    z-index: 4;
  }

  .center-value {
    font-weight: 900;
    font-size: 2.5rem;
    font-style: italic;
    transform: rotate(24deg);
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
  }

  .size-sm .center-value { font-size: 1.45rem; }
  .size-lg .center-value { font-size: 3.4rem; }

  .wild-badge {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    overflow: hidden;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .wild-quadrant.q-red { background: #ef4444; }
  .wild-quadrant.q-blue { background: #3b82f6; }
  .wild-quadrant.q-yellow { background: #f59e0b; }
  .wild-quadrant.q-green { background: #10b981; }

  .wild-symbol {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 900;
    font-size: 1.8rem;
    font-style: italic;
    transform: rotate(24deg);
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.9);
  }

  @keyframes playablePulse {
    from {
      box-shadow: 0 0 14px rgba(251, 191, 36, 0.7), 0 4px 12px rgba(0, 0, 0, 0.3);
      border-color: #fbbf24;
    }
    to {
      box-shadow: 0 0 26px rgba(251, 191, 36, 1), 0 0 8px #ffffff, 0 8px 20px rgba(0, 0, 0, 0.5);
      border-color: #ffffff;
    }
  }
`;
