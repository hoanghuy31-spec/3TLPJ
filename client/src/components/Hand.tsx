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
  return (
    <div className="hand-container">
      <div className="hand-header">
        <span className="hand-label">Your Hand ({cards.length} cards)</span>
        {isMyTurn && (
          <span className="turn-indicator-badge">It is your turn! Play a card or draw.</span>
        )}
      </div>

      <div className="cards-wrapper">
        {cards.length === 0 ? (
          <div className="empty-hand">No cards left!</div>
        ) : (
          cards.map((card, index) => {
            const isPlayable = isMyTurn && playableCardIds.includes(card.id);
            const isSelected = selectedCardId === card.id;

            return (
              <div
                key={card.id || `card-${index}`}
                className="hand-card-slot"
                style={{
                  zIndex: isSelected ? 30 : index + 1,
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
          padding: 0.5rem 1rem 1.5rem;
        }

        .hand-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .hand-label {
          font-weight: 700;
          font-size: 1rem;
          color: #e2e8f0;
        }

        .turn-indicator-badge {
          background: #fbbf24;
          color: #78350f;
          font-weight: 800;
          font-size: 0.85rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          animation: pulse 1.5s infinite;
        }

        .cards-wrapper {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .hand-card-slot {
          position: relative;
          transition: margin 0.2s ease;
        }

        /* Slightly overlap if there are many cards */
        @media (min-width: 640px) {
          .cards-wrapper:has(> :nth-child(8)) .hand-card-slot {
            margin-right: -24px;
          }
          .cards-wrapper:has(> :nth-child(8)) .hand-card-slot:hover {
            margin-right: 4px;
          }
        }

        .empty-hand {
          color: #94a3b8;
          font-style: italic;
          padding: 2rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
