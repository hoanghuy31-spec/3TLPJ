import type { Card as CardType } from '@uno/shared';
import Card from './Card';

interface HandProps {
  cards: CardType[];
  playableCardIds: string[];
  isMyTurn: boolean;
  onPlayCard: (card: CardType) => void;
  selectedCardId?: string;
}

export default function Hand({
  cards,
  playableCardIds,
  isMyTurn,
  onPlayCard,
  selectedCardId,
}: HandProps) {
  const total = cards.length;
  const mid = (total - 1) / 2;

  return (
    <div className="hand-container">
      <div className="hand-header">
        <span className="hand-label">
          Bài Trên Tay ({total} {total === 1 ? 'lá' : 'lá bài'})
        </span>
        {isMyTurn && (
          <span className="turn-indicator-badge">
            👉 Lượt của bạn! Hãy chọn 1 lá bài phát sáng để đánh hoặc rút bài.
          </span>
        )}
      </div>

      <div className="cards-wrapper">
        {total === 0 ? (
          <div className="empty-hand">Bạn đã hết bài! 🏆</div>
        ) : (
          cards.map((card, index) => {
            const isPlayable = isMyTurn && playableCardIds.includes(card.id);
            const isSelected = selectedCardId === card.id;

            // 3D Card Fanning calculations
            const angleStep = total > 12 ? 1.8 : total > 7 ? 2.5 : 3.5;
            const rotateDeg = total > 1 ? (index - mid) * angleStep : 0;
            const curveOffsetY = total > 1 ? Math.pow(Math.abs(index - mid), 1.5) * (total > 10 ? 1.2 : 2.2) : 0;

            return (
              <div
                key={card.id || `card-${index}`}
                className={`hand-card-slot ${isPlayable ? 'can-play' : ''} ${
                  isSelected ? 'is-selected' : ''
                }`}
                style={{
                  zIndex: isSelected ? 40 : index + 1,
                  transform: `rotate(${rotateDeg}deg) translateY(${curveOffsetY}px)`,
                }}
              >
                <Card
                  card={card}
                  isPlayable={isPlayable}
                  selected={isSelected}
                  onClick={() => onPlayCard(card)}
                  size="md"
                />
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .hand-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem 1.75rem;
          position: relative;
        }

        .hand-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .hand-label {
          font-weight: 800;
          font-size: 0.95rem;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .turn-indicator-badge {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #78350f;
          font-weight: 800;
          font-size: 0.85rem;
          padding: 0.3rem 0.9rem;
          border-radius: 9999px;
          animation: badgePulse 1.4s infinite;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
          border: 1px solid #fef08a;
        }

        .cards-wrapper {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 2.25rem 2rem 1rem;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          min-height: 175px;
        }

        .hand-card-slot {
          position: relative;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), margin 0.2s ease, z-index 0s;
          margin: 0 -12px;
          transform-origin: bottom center;
        }

        /* Adaptive overlap based on hand size */
        @media (min-width: 640px) {
          .cards-wrapper:has(> :nth-child(6)) .hand-card-slot {
            margin: 0 -18px;
          }
          .cards-wrapper:has(> :nth-child(10)) .hand-card-slot {
            margin: 0 -26px;
          }
          .cards-wrapper:has(> :nth-child(15)) .hand-card-slot {
            margin: 0 -32px;
          }
        }

        .hand-card-slot:hover {
          transform: translateY(-28px) scale(1.15) rotate(0deg) !important;
          z-index: 100 !important;
          margin: 0 6px !important;
          filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.6));
        }

        .hand-card-slot.is-selected {
          transform: translateY(-34px) scale(1.18) rotate(0deg) !important;
          z-index: 99 !important;
        }

        .empty-hand {
          color: #94a3b8;
          font-style: italic;
          font-weight: 700;
          padding: 2rem;
          font-size: 1.1rem;
        }

        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 6px 20px rgba(251, 191, 36, 0.7);
          }
        }
      `}</style>
    </div>
  );
}
