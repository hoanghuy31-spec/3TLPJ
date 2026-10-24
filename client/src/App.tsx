import { useState, useEffect, useCallback } from 'react';
import { getSocket, connectSocket, SOCKET_EVENTS } from './socket';
import type { Room, Player, GameState } from '@uno/shared';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

export type GamePage = 'home' | 'lobby' | 'game';

function App() {
  const [page, setPage] = useState<GamePage>('home');
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      if (!playerId && socket.id) {
        setPlayerId(socket.id);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setError('Mất kết nối với máy chủ!');
    };

    const handleRoomCreated = ({ room: newRoom }: { room: Room }) => {
      setRoom(newRoom);
      setGameState(null);
      setPage('lobby');
      setError('');
    };

    const handleRoomJoined = ({
      room: joinedRoom,
      playerId: pid,
    }: {
      room: Room;
      playerId: string;
    }) => {
      setRoom(joinedRoom);
      setPlayerId(pid);
      setGameState(null);
      setPage('lobby');
      setError('');
    };

    const handleRoomUpdated = ({ room: updatedRoom }: { room: Room }) => {
      setRoom(updatedRoom);
      if (updatedRoom.gameState) {
        setGameState(updatedRoom.gameState);
      }
    };

    const handleRoomError = ({ message }: { message: string }) => {
      setError(message);
    };

    const handleGameError = ({ message }: { message: string }) => {
      setError(message);
    };

    const handlePlayerJoined = ({ player }: { player: Player }) => {
      console.log('Player joined:', player.name);
    };

    const handlePlayerLeft = ({ playerId: leftId }: { playerId: string }) => {
      console.log('Player left:', leftId);
    };

    const handleGameStarted = ({ gameState: newGameState }: { gameState: GameState }) => {
      setGameState(newGameState);
      setPage('game');
      setError('');
    };

    const handleGameStateUpdate = ({ gameState: updatedState }: { gameState: GameState }) => {
      setGameState(updatedState);
    };

    const handleGameEnded = ({ gameState: endedState }: { gameState: GameState }) => {
      setGameState(endedState);
    };

    const handleCardPlayed = ({ gameState: playedState }: { gameState: GameState }) => {
      setGameState(playedState);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
    socket.on(SOCKET_EVENTS.GAME_ERROR, handleGameError);
    socket.on(SOCKET_EVENTS.ROOM_PLAYER_JOINED, handlePlayerJoined);
    socket.on(SOCKET_EVENTS.ROOM_PLAYER_LEFT, handlePlayerLeft);
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, handleGameStateUpdate);
    socket.on(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
    socket.on(SOCKET_EVENTS.CARD_PLAYED, handleCardPlayed);

    connectSocket().catch(() => {});

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
      socket.off(SOCKET_EVENTS.GAME_ERROR, handleGameError);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_JOINED, handlePlayerJoined);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_LEFT, handlePlayerLeft);
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE, handleGameStateUpdate);
      socket.off(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
      socket.off(SOCKET_EVENTS.CARD_PLAYED, handleCardPlayed);
    };
  }, [playerId]);

  const handleCreateRoom = useCallback(
    async (name: string, avatar?: string, cardSkin?: string) => {
      setError('');
      setPlayerName(name);
      try {
        await connectSocket();
        getSocket().emit(SOCKET_EVENTS.ROOM_CREATE, {
          playerName: name,
          avatar: avatar || '🧑',
          cardSkin: cardSkin || 'classic',
        });
      } catch {
        setError('Không thể kết nối đến máy chủ!');
      }
    },
    []
  );

  const handleJoinRoom = useCallback(
    async (roomCode: string, name: string, avatar?: string, cardSkin?: string) => {
      setError('');
      setPlayerName(name);
      try {
        await connectSocket();
        getSocket().emit(SOCKET_EVENTS.ROOM_JOIN, {
          roomCode,
          playerName: name,
          avatar: avatar || '🧑',
          cardSkin: cardSkin || 'classic',
        });
      } catch {
        setError('Không thể kết nối đến máy chủ!');
      }
    },
    []
  );

  const handleLeaveRoom = useCallback(() => {
    getSocket().emit(SOCKET_EVENTS.ROOM_LEAVE);
    setRoom(null);
    setGameState(null);
    setPage('home');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setPage('lobby');
  }, []);

  const handleToggleReady = useCallback((ready: boolean) => {
    getSocket().emit(SOCKET_EVENTS.ROOM_READY, { ready });
  }, []);

  const activePlayerId = playerId || getSocket().id || '';

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {!isConnected && page === 'home' && (
        <div className="connection-status">Đang kết nối tới server...</div>
      )}

      {page === 'home' && (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
        />
      )}

      {page === 'lobby' && room && (
        <Lobby
          room={room}
          playerId={activePlayerId}
          playerName={playerName}
          onLeave={handleLeaveRoom}
          onToggleReady={handleToggleReady}
        />
      )}

      {page === 'game' && room && gameState && (
        <GameBoard
          room={room}
          gameState={gameState}
          playerId={activePlayerId}
          playerName={playerName}
          onLeave={handleLeaveRoom}
          onBackToLobby={handleBackToLobby}
        />
      )}

      <style>{`
        .error-banner {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: #dc2626;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
          font-weight: 700;
          animation: slideDown 0.25s ease-out;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .error-banner button {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          line-height: 1;
        }

        .connection-status {
          position: fixed;
          bottom: 16px;
          right: 16px;
          background: #d97706;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          z-index: 50;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

export default App;
