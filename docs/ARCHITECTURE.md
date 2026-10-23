# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 React Application                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │   Home   │  │  Lobby   │  │   Game Board     │  │   │
│  │  │  Page    │──│  Page    │──│   (Future M2)    │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Socket.IO Client                         │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Socket.IO Server                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │ Room Manager │  │ Game Manager │  │ Game Logic │  │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Express HTTP Server                      │   │
│  │  GET /health                                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Socket.IO Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ playerName: string }` | Create a new room |
| `room:join` | `{ roomCode: string; playerName: string }` | Join existing room |
| `room:leave` | `{}` | Leave current room |
| `room:ready` | `{ ready: boolean }` | Toggle ready status |
| `game:start` | `{}` | Host starts the game |
| `card:play` | `{ cardId: string; chosenColor?: CardColor }` | Play a card |
| `card:draw` | `{}` | Draw a card from deck |
| `uno:call` | `{}` | Call UNO |
| `ping` | `{}` | Ping server |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:created` | `{ room: Room }` | Room created successfully |
| `room:joined` | `{ room: Room; playerId: string }` | Joined room successfully |
| `room:updated` | `{ room: Room }` | Room state changed |
| `room:error` | `{ message: string }` | Room operation error |
| `room:player-joined` | `{ player: Player }` | New player joined |
| `room:player-left` | `{ playerId: string }` | Player left room |
| `game:started` | `{ gameState: GameState }` | Game started |
| `game:state-update` | `{ gameState: GameState }` | Game state changed |
| `game:ended` | `{ winner: Player; gameState: GameState }` | Game ended |
| `turn:changed` | `{ currentPlayerIndex: number; playerId: string }` | Turn changed |
| `card:played` | `{ playerId: string; card: Card; gameState: GameState }` | Card played |
| `card:drawn` | `{ playerId: string; card: Card }` | Card drawn |
| `player:uno-called` | `{ playerId: string }` | Player called UNO |
| `pong` | `{}` | Pong response |

## Data Flow

### Room Creation Flow

```
1. Client → Server: room:create { playerName }
2. Server creates Room object
3. Server adds player to Room
4. Server → Client: room:created { room }
5. Client displays Lobby
```

### Game Start Flow

```
1. Players join via room:join
2. Players toggle ready via room:ready
3. Host clicks Start when at least the minimum number of players have joined and every player is ready
4. Client → Server: game:start
5. Server validates the host and readiness, shuffles a standard deck, deals hands, and creates the initial game state
6. Server → All Clients: game:started { gameState }
```

The Lobby only enables the Start Game button for the host when these player-count and readiness conditions are met. Card-play, turn progression, and the game board are not implemented yet.

## Room State Machine

```
    ┌─────────┐
    │ WAITING │ ←── Players joining/leaving
    └────┬────┘
         │ Host starts (all ready)
         ▼
    ┌─────────┐
    │STARTING │ ←── Game initializing
    └────┬────┘
         │ Initialization complete
         ▼
    ┌─────────┐
    │ PLAYING │ ←── Active gameplay
    └────┬────┘
         │ Winner found
         ▼
    ┌──────────┐
    │ FINISHED │
    └──────────┘
```

## Directory Structure

```
server/src/
├── index.ts          # Entry point, Express + Socket.IO setup
├── game/
│   ├── deck.ts       # Deck creation (108 cards)
│   ├── shuffle.ts    # Fisher-Yates shuffle
│   ├── deal.ts       # Card dealing
│   └── rules.ts      # Game rules (TODO for M2+)
└── types/
    └── server.ts     # Server-specific types

client/src/
├── App.tsx           # Main app, routing
├── socket.ts         # Socket.IO client wrapper
├── components/
│   ├── Home.tsx      # Home page (create/join room)
│   └── Lobby.tsx     # Lobby (player list, ready, start)
├── index.css         # Global styles
└── main.tsx          # React entry point
```
