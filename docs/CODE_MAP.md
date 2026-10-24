# Code Map

Document mapping of all exported functions, components, and types in the project.

**Last Updated:** 2026-10-24  
**Update Rule:** Mọi function/component mới phải được thêm vào file này trong cùng PR.

---

## Luồng Chính: Tạo phòng → Vào phòng → Chơi bài (M0 & M1)

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
10. Host click "Start Game" khi đủ người và mọi người đã Ready
    └── Server index.ts: Nhận game:start → xáo bài, chia bài, tạo initial GameState
    └── Emit 'game:started' → Client chuyển sang trang GameBoard
11. Bàn chơi GameBoard.tsx:
    └── Đánh bài: socket.emit('card:play', { cardId, chosenColor })
    └── Rút bài: socket.emit('card:draw')
    └── Hô UNO: socket.emit('uno:call')
```

**Socket.IO Events Used:**
- `room:create` / `room:created`
- `room:join` / `room:joined`
- `room:player-joined`
- `room:updated`
- `game:start` / `game:started`
- `card:play` / `card:played`
- `card:draw` / `card:drawn`
- `turn:changed`
- `uno:call` / `player:uno-called`
- `game:state-update`
- `game:ended`

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
- **Used by:** `server/index.ts`, `client/components/GameBoard.tsx`

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

### rules.ts (M1 Core Game Logic)

#### `canPlayCard()`
- **File:** `server/src/game/rules.ts:19`
- **Mô tả:** Kiểm tra lá bài có đánh được trên lá bài trên cùng không (theo màu, giá trị hoặc lá Wild)
- **Input:** `playedCard: Card, topCard: Card, currentColor: CardColor`
- **Output:** `boolean`
- **Test:** `server/src/game/rules.test.ts`
- **Used by:** `getPlayableCards()`, `server/src/index.ts`

#### `getPlayableCards()`
- **File:** `server/src/game/rules.ts:39`
- **Mô tả:** Lọc tất cả các lá bài có thể đánh được từ trên tay người chơi
- **Input:** `hand: Card[], topCard: Card, currentColor: CardColor`
- **Output:** `Card[]`
- **Test:** `server/src/game/rules.test.ts`

#### `getNextPlayerIndex()`
- **File:** `server/src/game/rules.ts:57`
- **Mô tả:** Tính toán vị trí người chơi tiếp theo theo chiều chơi và số bước (hỗ trợ Skip)
- **Input:** `currentIndex: number, playerCount: number, direction: 1 | -1, step?: number`
- **Output:** `number`
- **Test:** `server/src/game/rules.test.ts`

#### `handleSkip()`
- **File:** `server/src/game/rules.ts:74`
- **Mô tả:** Xử lý hiệu ứng lá bài Skip (bỏ qua lượt của người kế tiếp)
- **Input:** `currentPlayerIndex: number, playerCount: number, direction: 1 | -1`
- **Output:** `number`
- **Test:** `server/src/game/rules.test.ts`

#### `handleReverse()`
- **File:** `server/src/game/rules.ts:89`
- **Mô tả:** Xử lý đảo chiều chơi (1 ↔ -1)
- **Input:** `playerCount: number, direction: 1 | -1`
- **Output:** `1 | -1`
- **Test:** `server/src/game/rules.test.ts`

#### `handleDraw2()`, `handleWild()`, `handleWildDraw4()`
- **File:** `server/src/game/rules.ts:100-135`
- **Mô tả:** Xử lý hiệu ứng các lá bài đặc biệt Draw 2, Wild, Wild Draw 4
- **Test:** `server/src/game/rules.test.ts`

#### `canCallUno()`, `checkMissedUno()`, `checkWin()`, `calculateScore()`
- **File:** `server/src/game/rules.ts:145-200`
- **Mô tả:** Kiểm tra điều kiện hô UNO, quên hô UNO, điều kiện thắng và tính điểm
- **Test:** `server/src/game/rules.test.ts`

#### `replenishDeck()`
- **File:** `server/src/game/rules.ts:210`
- **Mô tả:** Tái tạo bộ bài rút từ xấp bài đã đánh khi hết bài rút (giữ lại lá trên cùng)
- **Test:** `server/src/game/rules.test.ts`

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
- `SOCKET_EVENTS.ROOM_CREATE`
- `SOCKET_EVENTS.ROOM_JOIN`
- `SOCKET_EVENTS.ROOM_LEAVE`
- `SOCKET_EVENTS.ROOM_READY`
- `SOCKET_EVENTS.GAME_START` - Khởi tạo ván đấu, xáo bài, chia bài
- `SOCKET_EVENTS.CARD_PLAY` - Xử lý đánh bài, kiểm tra hợp lệ, hiệu ứng bài và điều kiện thắng
- `SOCKET_EVENTS.CARD_DRAW` - Xử lý rút bài từ bộ bài (tự động tái tạo khi cạn) và chuyển lượt
- `SOCKET_EVENTS.UNO_CALL` - Đánh dấu trạng thái hô UNO của người chơi
- `SOCKET_EVENTS.PING`

**HTTP Endpoints:**
- `GET /health` - Health check

---

## client/src/

### App.tsx

#### `GamePage`
- **File:** `client/src/App.tsx:7`
- **Mô tả:** Type cho các trang trong app
- **Values:** `'home' | 'lobby' | 'game'`

#### `App` (default)
- **File:** `client/src/App.tsx:9`
- **Mô tả:** Component chính, quản lý routing giữa Home, Lobby và GameBoard
- **State:** `page`, `room`, `gameState`, `playerId`, `playerName`, `error`, `isConnected`
- **Socket Events:** `room:created`, `room:joined`, `room:updated`, `room:error`, `game:started`, `game:state-update`, `game:ended`, `card:played`

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

### components/GameBoard.tsx

#### `GameBoard` (default)
- **File:** `client/src/components/GameBoard.tsx`
- **Mô tả:** Bàn chơi UNO hoàn chỉnh - hiển thị đối thủ, bài rút, bài đánh, màu active, lượt chơi, nút hô UNO và modal kết thúc ván
- **Props:** `{ room, gameState, playerId, playerName, onLeave, onBackToLobby }`
- **Called by:** `App.tsx`

---

### components/Card.tsx

#### `Card` (default)
- **File:** `client/src/components/Card.tsx`
- **Mô tả:** Component hiển thị lá bài UNO chuẩn (màu sắc, số 0-9, Skip, Reverse, Draw 2, Wild, Wild Draw 4, úp/ngửa)
- **Props:** `{ card, isPlayable, onClick, size, faceDown, selected }`
- **Called by:** `GameBoard.tsx`, `Hand.tsx`

---

### components/Hand.tsx

#### `Hand` (default)
- **File:** `client/src/components/Hand.tsx`
- **Mô tả:** Hiển thị xấp bài trên tay người chơi, tự động highlight các lá bài hợp lệ được đánh
- **Props:** `{ cards, playableCardIds, isMyTurn, onPlayCard, selectedCardId }`
- **Called by:** `GameBoard.tsx`

---

### components/ColorPicker.tsx

#### `ColorPicker` (default)
- **File:** `client/src/components/ColorPicker.tsx`
- **Mô tả:** Modal chọn màu (Đỏ, Xanh dương, Vàng, Lục) khi người chơi đánh lá bài Wild hoặc Wild Draw 4
- **Props:** `{ onSelectColor, onCancel }`
- **Called by:** `GameBoard.tsx`

---

### socket.ts

#### `getSocket()`
- **File:** `client/src/socket.ts:18`
- **Mô tả:** Lấy socket instance (singleton)
- **Input:** None
- **Output:** `Socket<ServerToClientEvents, ClientToServerEvents>`
- **Called by:** `connectSocket()`, `disconnectSocket()`, `useSocket()`, `App.tsx`, `GameBoard.tsx`, `Lobby.tsx`

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
- **Called by:** Components

---

## Test Files

| Test File | Source File | Tests |
|-----------|-------------|-------|
| `server/src/game/rules.test.ts` | `server/src/game/rules.ts` | 24 tests |
| `server/src/game/deck.test.ts` | `server/src/game/deck.ts` | 16 tests |
| `server/src/game/shuffle.test.ts` | `server/src/game/shuffle.ts` | 12 tests |
| `server/src/game/deal.test.ts` | `server/src/game/deal.ts` | 18 tests |
| **Tổng cộng** | | **70 tests (100% Passed)** |

---

## File Import Graph

```
client/src/App.tsx
├── @uno/shared (types, SOCKET_EVENTS)
├── ./socket (getSocket, connectSocket, disconnectSocket)
└── ./components/Home, ./components/Lobby, ./components/GameBoard

client/src/components/GameBoard.tsx
├── @uno/shared (Card, CardColor, GameState, Room)
├── ../socket (getSocket, SOCKET_EVENTS)
└── ./Card, ./ColorPicker, ./Hand

client/src/components/Hand.tsx
├── @uno/shared (Card)
└── ./Card

client/src/components/ColorPicker.tsx
└── @uno/shared (CardColor)

client/src/components/Card.tsx
└── @uno/shared (Card, CardColor)

client/src/components/Home.tsx
└── react (useState)

client/src/components/Lobby.tsx
├── @uno/shared (Room, GAME_CONFIG)
└── react (useState, useEffect)

server/src/index.ts
├── express, http (app, httpServer)
├── socket.io (Server)
├── @uno/shared (GAME_CONFIG, SOCKET_EVENTS, types)
├── ./game/deal.js (initializeRound)
├── ./game/deck.js (createDeck)
├── ./game/shuffle.js (shuffleDeck)
└── ./game/rules.js (canCallUno, canPlayCard, checkWin, getNextPlayerIndex, handleReverse, isPlayableColor, isWildCard, replenishDeck)
```
