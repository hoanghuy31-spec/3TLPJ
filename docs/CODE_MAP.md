# Code Map

Document mapping of all exported functions, components, and types in the project.

**Last Updated:** 2024-01-15  
**Update Rule:** Mọi function/component mới phải được thêm vào file này trong cùng PR.

---

## Luồng Chính: Tạo phòng → Vào phòng → Thấy danh sách người chơi

```
1. Client: Home.tsx - User nhập tên và click "Create Room"
2. Client: App.tsx - Gọi connectSocket() → socket.emit('room:create', { playerName })
3. Server: index.ts - Nhận SOCKET_EVENTS.ROOM_CREATE
   └── generateRoomCode() - Tạo mã phòng 6 ký tự
   └── Tạo Room object, lưu vào Map
   └── socket.emit('room:created', { room })
4. Client: App.tsx - Nhận 'room:created', setState room → render Lobby
5. Lobby.tsx - Hiển thị danh sách players từ room.players
6. (User khác) Home.tsx - Nhập mã phòng, click "Join Room"
7. Client: socket.emit('room:join', { roomCode, playerName })
8. Server: index.ts - Nhận SOCKET_EVENTS.ROOM_JOIN
   └── getRoomByCode() - Tìm phòng
   └── Thêm player vào room
   └── socket.emit('room:joined', { room, playerId })
   └── socket.to(code).emit('room:player-joined', { player })
   └── socket.to(code).emit('room:updated', { room })
9. Client: Lobby.tsx - Nhận 'room:player-joined' hoặc 'room:updated'
   └── Cập nhật room state → hiển thị thêm player mới
```

**Socket.IO Events Used:**
- `room:create` / `room:created`
- `room:join` / `room:joined`
- `room:player-joined`
- `room:updated`

---

## shared/src/

### Types (types.ts)

#### `Card`
- **File:** `shared/src/types.ts:24`
- **Mô tả:** Đại diện một lá bài trong bộ bài
- **Input:** N/A (type/interface)
- **Output:** `{ id: string, color: CardColor, value: CardValue }`
- **Used by:** `client/App.tsx`, `client/socket.ts`, `server/game/*.ts`

#### `Player`
- **File:** `shared/src/types.ts:33`
- **Mô tả:** Thông tin người chơi
- **Input:** N/A
- **Output:** `{ id: string, name: string, isReady: boolean }`
- **Used by:** `client/Lobby.tsx`, `server/index.ts`

#### `Room`
- **File:** `shared/src/types.ts:42`
- **Mô tả:** Trạng thái phòng chơi
- **Input:** N/A
- **Output:** `{ id: string, hostId: string, players: Player[], maxPlayers: number, status: RoomStatus, createdAt: number }`
- **Used by:** `client/Lobby.tsx`, `server/index.ts`

#### `GameState`
- **File:** `shared/src/types.ts:59`
- **Mô tả:** Trạng thái toàn bộ ván chơi
- **Input:** N/A
- **Output:** `{ roomId, deck, discardPile, players, currentPlayerIndex, direction, currentColor, status, turnNumber, lastPlayedCard }`
- **Used by:** `server/index.ts` (M1+)

#### `GamePlayer`
- **File:** `shared/src/types.ts:75`
- **Mô tả:** Trạng thái người chơi trong game (mở rộng Player)
- **Input:** N/A
- **Output:** `{ id, name, isReady, cards: Card[], unoCalled: boolean }`
- **Used by:** `server/game/deal.ts`, `server/game/rules.ts`

#### `CardColor`
- **File:** `shared/src/types.ts:8`
- **Mô tả:** Loại màu bài
- **Values:** `'red' | 'blue' | 'green' | 'yellow' | 'black'`

#### `CardValue`
- **File:** `shared/src/types.ts:16`
- **Mô tả:** Giá trị lá bài
- **Values:** `'0'-'9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4'`

#### `ServerToClientEvents`
- **File:** `shared/src/types.ts:97`
- **Mô tả:** Interface cho events server gửi về client
- **Events:** `room:created`, `room:joined`, `room:updated`, `room:error`, `room:player-joined`, `room:player-left`, `game:started`, `game:state-update`, `game:ended`, `game:error`, `turn:changed`, `card:played`, `card:drawn`, `player:uno-called`, `pong`

#### `ClientToServerEvents`
- **File:** `shared/src/types.ts:129`
- **Mô tả:** Interface cho events client gửi lên server
- **Events:** `room:create`, `room:join`, `room:leave`, `room:ready`, `room:kick`, `game:start`, `turn:action`, `card:play`, `card:draw`, `uno:call`, `ping`

---

### Constants (constants.ts)

#### `GAME_CONFIG`
- **File:** `shared/src/constants.ts:10`
- **Mô tả:** Cấu hình game (số bài ban đầu, giới hạn người chơi, độ dài mã phòng, port)
- **Used by:** `server/index.ts`, `client/Lobby.tsx`, `server/game/deal.ts`

#### `SOCKET_EVENTS`
- **File:** `shared/src/constants.ts:132`
- **Mô tả:** Tên tất cả Socket.IO events
- **Used by:** `server/index.ts`, `client/socket.ts`

#### `CARD_POINTS`
- **File:** `shared/src/constants.ts:53`
- **Mô tả:** Điểm mỗi lá bài để tính điểm khi kết thúc ván
- **Used by:** `server/game/rules.ts`

#### `STANDARD_DECK_COMPOSITION`
- **File:** `shared/src/constants.ts:69`
- **Mô tả:** Thành phần bộ bài 108 lá chuẩn
- **Used by:** `server/game/deck.ts`

#### `PLAYABLE_COLORS`, `NUMBER_VALUES`, `ACTION_VALUES`, `WILD_VALUES`
- **File:** `shared/src/constants.ts:33-48`
- **Mô tả:** Arrays chứa các giá trị hợp lệ cho màu và giá trị bài

#### `HTTP_STATUS`, `ERROR_MESSAGES`
- **File:** `shared/src/constants.ts:166-187`
- **Mô tả:** HTTP status codes và thông báo lỗi

---

## server/src/game/

### deck.ts

#### `createDeck()`
- **File:** `server/src/game/deck.ts:13`
- **Mô tả:** Tạo bộ bài 108 lá tiêu chuẩn
- **Input:** None
- **Output:** `Card[]` (108 lá)
- **Test:** `server/src/game/deck.test.ts`
- **Used by:** `server/game/index.ts`

#### `createCustomDeck()`
- **File:** `server/src/game/deck.ts:34`
- **Mô tả:** Tạo bộ bài tùy chỉnh theo specification
- **Input:** `{ color: CardColor, value: CardValue }[]`
- **Output:** `Card[]`
- **Test:** `server/src/game/deck.test.ts`
- **Used by:** Tests

#### `getDeckSize()`
- **File:** `server/src/game/deck.ts:46`
- **Mô tả:** Trả về số lượng bài trong bộ bài tiêu chuẩn
- **Input:** None
- **Output:** `108`
- **Test:** `server/src/game/deck.test.ts`

#### `verifyDeck()`
- **File:** `server/src/game/deck.ts:55`
- **Mô tả:** Kiểm tra bộ bài có đúng 108 lá theo luật UNO
- **Input:** `Card[]`
- **Output:** `boolean`
- **Test:** `server/src/game/deck.test.ts`

---

### shuffle.ts

#### `shuffleDeck()`
- **File:** `server/src/game/shuffle.ts:12`
- **Mô tả:** Xáo bài dùng thuật toán Fisher-Yates (trả về array mới)
- **Input:** `Card[]`
- **Output:** `Card[]` (đã xáo, array mới)
- **Test:** `server/src/game/shuffle.test.ts`

#### `shuffleDeckInPlace()`
- **File:** `server/src/game/shuffle.ts:28`
- **Mô tả:** Xáo bài Fisher-Yates (sửa trực tiếp array)
- **Input:** `Card[]`
- **Output:** `Card[]` (đã xáo, same reference)
- **Test:** `server/src/game/shuffle.test.ts`

#### `SeededRandom`
- **File:** `server/src/game/shuffle.ts:41`
- **Mô tả:** Class tạo số ngẫu nhiên có seed (Mulberry32)
- **Methods:** `next()`, `nextInt(max)`
- **Test:** `server/src/game/shuffle.test.ts`

#### `shuffleDeckSeeded()`
- **File:** `server/src/game/shuffle.ts:73`
- **Mô tả:** Xáo bài với seed cố định (để reproduce trong test)
- **Input:** `Card[]`, `seed: number`
- **Output:** `Card[]`
- **Test:** `server/src/game/shuffle.test.ts`

---

### deal.ts

#### `dealCards()`
- **File:** `server/src/game/deal.ts:15`
- **Mô tả:** Chia bài cho người chơi từ bộ bài đã xáo
- **Input:** `deck: Card[]`, `players: { id, name }[]`, `cardsPerPlayer?: number` (default 7)
- **Output:** `{ hands: Map<string, Card[]>, remainingDeck: Card[] }`
- **Test:** `server/src/game/deal.test.ts`
- **Used by:** `initializeRound()`

#### `createGamePlayers()`
- **File:** `server/src/game/deal.ts:47`
- **Mô tả:** Tạo GamePlayer objects với bài đã chia
- **Input:** `players: { id, name }[]`, `hands: Map<string, Card[]>`
- **Output:** `GamePlayer[]`
- **Test:** `server/src/game/deal.test.ts`

#### `drawCards()`
- **File:** `server/src/game/deal.ts:66`
- **Mô tả:** Rút một số bài từ bộ bài
- **Input:** `deck: Card[]`, `count: number`
- **Output:** `{ drawn: Card[], remaining: Card[] }`
- **Test:** `server/src/game/deal.test.ts`

#### `initializeRound()`
- **File:** `server/src/game/deal.ts:86`
- **Mô tả:** Khởi tạo một ván mới (chia bài, lật bài đầu tiên)
- **Input:** `shuffledDeck: Card[]`, `players: { id, name }[]`
- **Output:** `{ gamePlayers: GamePlayer[], deck: Card[], discardPile: Card[], firstCard: Card }`
- **Test:** `server/src/game/deal.test.ts`
- **Used by:** M1 `game:start` handler

---

### rules.ts (M2 placeholders)

#### `canPlayCard()` - TODO M1.A.1
#### `getPlayableCards()` - TODO M1.A.2
#### `handleSkip()`, `handleReverse()`, `handleDraw2()` - TODO M1.A.3
#### `handleWild()`, `handleWildDraw4()` - TODO M1.A.3
#### `canCallUno()`, `checkMissedUno()`, `checkWin()`, `calculateScore()` - TODO M2
#### `isPlayableColor()`, `isWildCard()`, `isNumberCard()`, `isActionCard()` - TODO M2
#### `getCardPoints()`, `getHandPoints()` - TODO M2

---

## server/src/

### index.ts

#### `generateRoomCode()`
- **File:** `server/src/index.ts:42`
- **Mô tả:** Tạo mã phòng 6 ký tự ngẫu nhiên
- **Input:** None
- **Output:** `string` (VD: "ABC123")
- **Used by:** `SOCKET_EVENTS.ROOM_CREATE` handler

#### `getRoomByCode()`
- **File:** `server/src/index.ts:52`
- **Mô tả:** Tìm phòng theo mã
- **Input:** `code: string`
- **Output:** `Room | undefined`
- **Used by:** `SOCKET_EVENTS.ROOM_JOIN` handler

#### `handlePlayerLeave()`
- **File:** `server/src/index.ts:191`
- **Mô tả:** Xử lý khi người chơi rời phòng
- **Input:** `socket`
- **Actions:** Xóa khỏi room, notify others, transfer host nếu cần
- **Used by:** `SOCKET_EVENTS.ROOM_LEAVE`, `disconnect` event

#### `app`, `io` (exports)
- **File:** `server/src/index.ts:229`
- **Mô tả:** Express app và Socket.IO server instance
- **Used by:** Tests

**Socket Handlers:**
- `SOCKET_EVENTS.ROOM_CREATE` (line 64)
- `SOCKET_EVENTS.ROOM_JOIN` (line 107)
- `SOCKET_EVENTS.ROOM_LEAVE` (line 159)
- `SOCKET_EVENTS.ROOM_READY` (line 164)
- `SOCKET_EVENTS.GAME_START` - Host-only; requires the minimum player count and all players ready, then shuffles, deals, stores initial `GameState`, and emits `game:started`
- `SOCKET_EVENTS.PING` (line 185)

**HTTP Endpoints:**
- `GET /health` (line 32) - Health check

---

## client/src/

### App.tsx

#### `GamePage`
- **File:** `client/src/App.tsx:152`
- **Mô tả:** Type cho các trang trong app
- **Values:** `'home' | 'lobby'`

#### `App` (default)
- **File:** `client/src/App.tsx:1`
- **Mô tả:** Component chính, quản lý routing giữa Home và Lobby
- **State:** `currentPage`, `room`, `playerId`, `playerName`, `error`
- **Socket Events:** `room:created`, `room:joined`, `room:error`, `room:player-joined`, `room:player-left`, `room:updated`

---

### components/Home.tsx

#### `Home` (default)
- **File:** `client/src/components/Home.tsx:9`
- **Mô tả:** Trang chủ - tạo phòng hoặc vào phòng
- **Props:** `{ onCreateRoom, onJoinRoom, error }`
- **States:** `playerName`, `roomCode`, `mode` ('choose' | 'create' | 'join')
- **Called by:** `App.tsx`

---

### components/Lobby.tsx

#### `Lobby` (default)
- **File:** `client/src/components/Lobby.tsx:13`
- **Mô tả:** Sảnh chờ - hiển thị danh sách người chơi, nút ready
- **Props:** `{ room, playerId, playerName, onLeave, onToggleReady }`
- **Features:** Copy mã phòng, toggle ready, hiển thị empty slots; Host chỉ có thể bắt đầu khi đủ số người tối thiểu và mọi người đã ready
- **Socket event:** Nút Start Game phát `SOCKET_EVENTS.GAME_START`
- **Called by:** `App.tsx`

---

### socket.ts

#### `getSocket()`
- **File:** `client/src/socket.ts:18`
- **Mô tả:** Lấy socket instance (singleton)
- **Input:** None
- **Output:** `Socket<ServerToClientEvents, ClientToServerEvents>`
- **Called by:** `connectSocket()`, `disconnectSocket()`, `useSocket()`, `App.tsx`

#### `connectSocket()`
- **File:** `client/src/socket.ts:25`
- **Mô tả:** Kết nối socket với Promise
- **Input:** None
- **Output:** `Promise<void>`
- **Called by:** `App.tsx`

#### `disconnectSocket()`
- **File:** `client/src/socket.ts:46`
- **Mô tả:** Ngắt kết nối và cleanup socket
- **Input:** None
- **Output:** `void`
- **Called by:** `App.tsx`

#### `useSocket()`
- **File:** `client/src/socket.ts:53`
- **Mô tả:** React hook để sử dụng socket trong components
- **Input:** None
- **Output:** `Socket`
- **Called by:** Components (M1+)

---

## Test Files

| Test File | Source File | Tests |
|-----------|-------------|-------|
| `server/src/game/deck.test.ts` | `server/src/game/deck.ts` | 16 tests |
| `server/src/game/shuffle.test.ts` | `server/src/game/shuffle.ts` | 12 tests |
| `server/src/game/deal.test.ts` | `server/src/game/deal.ts` | 18 tests |

---

## File Import Graph

```
client/src/App.tsx
├── @uno/shared (types, SOCKET_EVENTS)
├── ./socket (getSocket, connectSocket, disconnectSocket)
└── ./components/Home, ./components/Lobby

client/src/components/Home.tsx
└── react (useState)

client/src/components/Lobby.tsx
├── @uno/shared (Room, GAME_CONFIG)
└── react (useState, useEffect)

client/src/socket.ts
├── socket.io-client (io, Socket)
└── @uno/shared (ClientToServerEvents, ServerToClientEvents, SOCKET_EVENTS)

server/src/index.ts
├── express, http (app, httpServer)
├── socket.io (Server)
└── @uno/shared (GAME_CONFIG, SOCKET_EVENTS, types)

server/src/game/deck.ts
├── uuid (v4)
└── @uno/shared (Card, CardColor, CardValue, STANDARD_DECK_COMPOSITION)

server/src/game/shuffle.ts
└── @uno/shared (Card)

server/src/game/deal.ts
├── @uno/shared (GamePlayer, GAME_CONFIG)
└── @uno/shared (Card)

shared/src/index.ts
├── ./types.js (export *)
└── ./constants.js (export *)
```
