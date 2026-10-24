# Roadmap

## M0 - Skeleton (Completed ✅)

### M0 Goals
- [x] Monorepo structure with npm workspaces
- [x] TypeScript, ESLint, Prettier, Vitest configuration
- [x] Shared package with types and constants
- [x] Server: Express + Socket.IO, basic room creation/joining
- [x] Client: React + Vite, Home page + Lobby
- [x] Game logic: deck (108 cards), shuffle, deal
- [x] Unit tests for game logic (46 tests)

### M0 Completed Components

#### shared/src/
- `Card`, `Player`, `Room`, `GameState`, `GamePlayer` types
- `CardColor`, `CardValue`, `RoomStatus`, `GameStatus` types
- `ServerToClientEvents`, `ClientToServerEvents` interfaces
- `GAME_CONFIG`, `SOCKET_EVENTS`, `CARD_POINTS`, `STANDARD_DECK_COMPOSITION`

#### server/src/
- `createDeck()`, `createCustomDeck()`, `getDeckSize()`, `verifyDeck()` (deck.ts)
- `shuffleDeck()`, `shuffleDeckInPlace()`, `shuffleDeckSeeded()`, `SeededRandom` (shuffle.ts)
- `dealCards()`, `createGamePlayers()`, `drawCards()`, `initializeRound()` (deal.ts)
- `canPlayCard()`, `getPlayableCards()` (rules.ts) - placeholders
- Socket.IO handlers for room:create, room:join, room:leave, room:ready
- Host-only `game:start` handler validates player count/readiness, shuffles and deals cards, stores initial game state, and emits `game:started`
- `/health` endpoint

#### client/src/
- `Home` component (Home.tsx)
- `Lobby` component (Lobby.tsx)
- `getSocket()`, `connectSocket()`, `disconnectSocket()`, `useSocket()` (socket.ts)

---

## M1 - Core Game Logic (Completed ✅)

### A - Server/Logic (Game Rules & Turn Management)

- [x] **M1.A.1** Implement `canPlayCard()` in `server/src/game/rules.ts`
  - Validate card matching (color, value, or wild)
  - Input: `Card`, `Card`, `CardColor` → Output: `boolean`

- [x] **M1.A.2** Implement `getPlayableCards()` in `server/src/game/rules.ts`
  - Filter playable cards from player's hand
  - Input: `Card[]`, `Card`, `CardColor` → Output: `Card[]`

- [x] **M1.A.3** Implement action card effects in `server/src/game/rules.ts`
  - `handleSkip()`, `handleReverse()`, `handleDraw2()`, `handleWild()`, `handleWildDraw4()`
  - Update game direction and turn skipping logic

- [x] **M1.A.4** Implement `applyCardEffect()` in `server/src/game/rules.ts`
  - Apply effects when cards are played
  - Handle draw pile replenishment

- [x] **M1.A.5** Implement turn management in `server/src/index.ts`
  - [x] Initial `game:start` handler (host/readiness checks and round initialization)
  - [ ] Turn validation, `turn:action` handler
  - `card:play`, `card:draw` handlers

- [x] **M1.A.6** Implement UNO call validation
  - Check if player has 1 card, validate UNO call timing
  - Penalize missed UNO calls

### B - Client/UI (Game Board)

- [x] **M1.B.1** Create `GameBoard` component in `client/src/components/GameBoard.tsx`
  - Display discard pile, current player indicator
  - Show playable vs non-playable cards

- [x] **M1.B.2** Create `Card` component in `client/src/components/Card.tsx`
  - Visual card rendering with color and value
  - Draggable for playing cards

- [x] **M1.B.3** Create `Hand` component in `client/src/components/Hand.tsx`
  - Display player's cards, highlight playable cards
  - Handle card selection

- [x] **M1.B.4** Create `ColorPicker` component in `client/src/components/ColorPicker.tsx`
  - Modal for choosing color after playing wild card

- [x] **M1.B.5** Implement game state socket listeners
  - `game:started`, `game:state-update`, `turn:changed`
  - `card:played`, `card:drawn`

### C - Integration & Testing

- [x] **M1.C.1** Add unit tests for `canPlayCard()`
  - Test all card matching scenarios

- [x] **M1.C.2** Add unit tests for action card effects
  - Test skip, reverse, draw2, wild, wild_draw4

- [x] **M1.C.3** Integration test: full game flow
  - Test from game start to end

---

## M2 - Complete Game Features

### A - Server/Logic

- [ ] **M2.A.1** Implement scoring system
  - Calculate scores when round ends
  - Track cumulative scores

- [ ] **M2.A.2** Implement game end conditions
  - Detect when a player wins
  - Handle multiple rounds

- [ ] **M2.A.3** Implement special rules
  - 7-0 rule (swap hands)
  - Jump-in (play out of turn if matching)

### B - Client/UI

- [ ] **M2.B.1** Create `ScoreBoard` component
  - Display player scores
  - Show round winner

- [ ] **M2.B.2** Create `GameOver` modal
  - Final scores, winner announcement
  - Rematch/play again options

- [ ] **M2.B.3** Add card animations
  - Play animation, draw animation
  - UNO call animation

### C - Testing & DevOps

- [ ] **M2.C.1** Add E2E tests with Playwright
  - Full game flow test
  - Multiple game sessions

- [ ] **M2.C.2** Set up staging environment
  - Deploy to staging server

---

## M3 - Polish & Production

### A - Server/Logic

- [ ] **M3.A.1** Implement room password protection
- [ ] **M3.A.2** Add player kick/ban functionality
- [ ] **M3.A.3** Implement spectate mode
- [ ] **M3.A.4** Add reconnect handling
- [ ] **M3.A.5** Persist game state (database)

### B - Client/UI

- [ ] **M3.B.1** Add sound effects
- [ ] **M3.B.2** Add chat functionality
- [ ] **M3.B.3** Implement settings (muted, animations)
- [ ] **M3.B.4** Add friend invite via link

### C - DevOps & Documentation

- [ ] **M3.C.1** Production deployment
- [ ] **M3.C.2** Performance optimization
- [ ] **M3.C.3** Update CODE_MAP.md
- [ ] **M3.C.4** User documentation

---

## Task Assignment Guidelines

When working on this project:

| Role | Focus Areas |
|------|-------------|
| **A (Logic/Server)** | `server/src/game/`, `server/src/index.ts`, game rules, socket handlers |
| **B (UI/Client)** | `client/src/components/`, `client/src/App.tsx`, CSS, user interactions |
| **C (Integration/Test/Deploy)** | Tests, CI/CD, deployment, performance, cross-cutting concerns |

### Rules to Avoid Conflicts
1. **A** và **B** không đụng file nhau:
   - A: chỉ sửa `server/` và `shared/`
   - B: chỉ sửa `client/`

2. **C** sửa test files và `.github/workflows/`

3. Khi merge PR, đảm bảo cả 3 workspace đều pass `npm run lint` và `npm test`

4. Mọi function mới phải được thêm vào `docs/CODE_MAP.md` trong cùng PR
