import { useState, useEffect } from 'react';
import type { Room } from '@uno/shared';
import { GAME_CONFIG } from '@uno/shared';

interface LobbyProps {
  room: Room;
  playerId: string;
  playerName: string;
  onLeave: () => void;
  onToggleReady: (ready: boolean) => void;
}

export default function Lobby({ room, playerId, onLeave, onToggleReady }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  const currentPlayer = room.players.find(p => p.id === playerId);
  const isReady = currentPlayer?.isReady ?? false;
  
  const allReady = room.players.length >= GAME_CONFIG.MIN_PLAYERS && 
    room.players.every(p => p.isReady || p.id === playerId);

  useEffect(() => {
    // Copy room code to clipboard
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
    } catch {
      // Fallback for older browsers
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
    // TODO: Implement game start logic
    console.log('Start game clicked');
  };

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <div className="lobby-header">
          <div className="room-info">
            <h1>Room: <span className="room-code">{room.id}</span></h1>
            <button 
              className={`btn btn-secondary copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyCode}
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
          <button className="btn btn-secondary leave-btn" onClick={onLeave}>
            Leave Room
          </button>
        </div>

        <div className="players-section">
          <h2>Players ({room.players.length}/{room.maxPlayers})</h2>
          <div className="players-list">
            {room.players.map((player) => (
              <div 
                key={player.id} 
                className={`player-card ${player.id === playerId ? 'current' : ''} ${player.isReady ? 'ready' : ''}`}
              >
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <span className="player-name">
                    {player.name}
                    {player.id === room.hostId && <span className="host-badge">Host</span>}
                  </span>
                  <span className="player-status">
                    {player.isReady ? 'Ready' : 'Not ready'}
                  </span>
                </div>
                {player.id === playerId && (
                  <button 
                    className={`btn ${isReady ? 'btn-secondary' : 'btn-primary'} ready-btn`}
                    onClick={() => onToggleReady(!isReady)}
                  >
                    {isReady ? 'Cancel Ready' : 'Ready'}
                  </button>
                )}
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="player-avatar empty-avatar">?</div>
                <div className="player-info">
                  <span className="player-name empty-name">Waiting for player...</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-actions">
          {isHost ? (
            <button 
              className="btn btn-primary start-btn"
              onClick={handleStartGame}
              disabled={!allReady}
            >
              {allReady ? 'Start Game' : 'Waiting for players to ready up...'}
            </button>
          ) : (
            <p className="waiting-message">Waiting for host to start the game...</p>
          )}
        </div>
      </div>

      <style>{`
        .lobby-page {
          min-height: 100vh;
          padding: 2rem 1rem;
        }

        .lobby-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .room-info h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .room-code {
          font-family: monospace;
          background: rgba(79, 70, 229, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          letter-spacing: 0.1em;
        }

        .copy-btn {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }

        .copy-btn.copied {
          background: #10b981;
          border-color: #10b981;
        }

        .leave-btn {
          font-size: 0.875rem;
        }

        .players-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .players-section h2 {
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .player-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .player-card.current {
          background: rgba(79, 70, 229, 0.2);
          border: 1px solid rgba(79, 70, 229, 0.5);
        }

        .player-card.ready {
          border-left: 3px solid #10b981;
        }

        .player-card.empty {
          opacity: 0.5;
        }

        .player-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .player-avatar.empty-avatar {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .player-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .host-badge {
          font-size: 0.75rem;
          background: #f59e0b;
          color: black;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          font-weight: 500;
        }

        .empty-name {
          color: rgba(255, 255, 255, 0.5);
        }

        .player-status {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .ready-btn {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }

        .lobby-actions {
          text-align: center;
        }

        .start-btn {
          padding: 1rem 3rem;
          font-size: 1.1rem;
          width: 100%;
        }

        .waiting-message {
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}