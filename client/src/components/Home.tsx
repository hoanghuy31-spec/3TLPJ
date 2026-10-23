import { useState } from 'react';

interface HomeProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomCode: string, name: string) => void;
  error: string;
}

export default function Home({ onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateRoom(playerName.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="game-title">Card Game</h1>
        <p className="game-subtitle">Play with friends in real-time</p>

        {mode === 'choose' && (
          <div className="mode-choices">
            <button 
              className="btn btn-primary mode-btn"
              onClick={() => setMode('create')}
            >
              Create Room
            </button>
            <button 
              className="btn btn-secondary mode-btn"
              onClick={() => setMode('join')}
            >
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="form">
            <h2>Create New Room</h2>
            <div className="form-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                className="input"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={!playerName.trim()}>
                Create
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('choose')}>
                Back
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="form">
            <h2>Join Room</h2>
            <div className="form-group">
              <label htmlFor="playerNameJoin">Your Name</label>
              <input
                id="playerNameJoin"
                type="text"
                className="input"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="roomCode">Room Code</label>
              <input
                id="roomCode"
                type="text"
                className="input room-code-input"
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!playerName.trim() || roomCode.length < 6}
              >
                Join
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('choose')}>
                Back
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .home-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 1rem;
        }

        .home-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 3rem;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .game-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .game-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }

        .mode-choices {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mode-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
        }

        .form {
          text-align: left;
        }

        .form h2 {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .room-code-input {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .form-actions .btn {
          flex: 1;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}