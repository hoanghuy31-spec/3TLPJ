import { useState, useEffect, useCallback } from 'react';
import { getSocket, connectSocket, SOCKET_EVENTS } from './socket';
import type { Room, Player } from '@uno/shared';
import Home from './components/Home';
import Lobby from './components/Lobby';

export type GamePage = 'home' | 'lobby';

function App() {
  const [page, setPage] = useState<GamePage>('home');
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setError('Disconnected from server');
    };

    const handleRoomCreated = ({ room: newRoom }: { room: Room }) => {
      setRoom(newRoom);
      setPage('lobby');
      setError('');
    };

    const handleRoomJoined = ({ room: joinedRoom, playerId: pid }: { room: Room; playerId: string }) => {
      setRoom(joinedRoom);
      setPlayerId(pid);
      setPage('lobby');
      setError('');
    };

    const handleRoomUpdated = ({ room: updatedRoom }: { room: Room }) => {
      setRoom(updatedRoom);
    };

    const handleRoomError = ({ message }: { message: string }) => {
      setError(message);
    };

    const handlePlayerJoined = ({ player }: { player: Player }) => {
      console.log('Player joined:', player.name);
    };

    const handlePlayerLeft = ({ playerId: leftId }: { playerId: string }) => {
      console.log('Player left:', leftId);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
    socket.on(SOCKET_EVENTS.ROOM_PLAYER_JOINED, handlePlayerJoined);
    socket.on(SOCKET_EVENTS.ROOM_PLAYER_LEFT, handlePlayerLeft);

    // Try to connect on mount
    connectSocket().catch(() => {
      // Will retry when user user interacts
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_JOINED, handlePlayerJoined);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_LEFT, handlePlayerLeft);
    };
  }, []);

  const handleCreateRoom = useCallback(async (name: string) => {
    setError('');
    setPlayerName(name);
    try {
      await connectSocket();
      getSocket().emit(SOCKET_EVENTS.ROOM_CREATE, { playerName: name });
    } catch {
      setError('Failed to connect to server');
    }
  }, []);

  const handleJoinRoom = useCallback(async (roomCode: string, name: string) => {
    setError('');
    setPlayerName(name);
    try {
      await connectSocket();
      getSocket().emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, playerName: name });
    } catch {
      setError('Failed to connect to server');
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    getSocket().emit(SOCKET_EVENTS.ROOM_LEAVE);
    setRoom(null);
    setPage('home');
  }, []);

  const handleToggleReady = useCallback((ready: boolean) => {
    getSocket().emit(SOCKET_EVENTS.ROOM_READY, { ready });
  }, []);

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {!isConnected && page === 'home' && (
        <div className="connection-status">
          Connecting to server...
        </div>
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
          playerId={playerId || getSocket().id || ''}
          playerName={playerName}
          onLeave={handleLeaveRoom}
          onToggleReady={handleToggleReady}
        />
      )}
    </div>
  );
}

export default App;