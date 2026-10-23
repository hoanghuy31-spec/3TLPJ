# Test Plan

## Overview

This document outlines the testing strategy for the UNO-like card game.

## Test Types

### 1. Unit Tests (Game Logic)

**Location**: `server/src/game/*.test.ts`

**Coverage**:
- [x] Deck creation (108 cards, correct composition)
- [x] Deck shuffling (Fisher-Yates algorithm)
- [x] Card dealing (7 cards per player)
- [x] Seeded randomness (deterministic testing)

**Planned** (M1+):
- [ ] Card validation rules
- [ ] Turn management
- [ ] UNO call validation

### 2. Component Tests (UI)

**Location**: `client/src/components/*.test.tsx`

**Coverage**:
- [ ] Home component (create/join room forms) - **not yet written**
- [ ] Lobby component (player list, ready button) - **not yet written**

> **Note**: The repo currently has no component test files (`*.test.tsx`). The vitest
> configs accept them (`passWithNoTests`), but they still need to be created in M1.0.
>
**Planned** (M1+):
- [ ] Game board component
- [ ] Card display component

### 3. Integration Tests

**Planned** (M2+):
- [ ] Room creation flow
- [ ] Game start flow
- [ ] Card playing flow

## Running Tests

```bash
# All tests
npm test

# Server tests only
npm test --workspace=server

# Client tests only
npm test --workspace=client

# Watch mode
npm run test:watch --workspace=server
```

## Test Coverage Goals

| Package | Target |
|---------|--------|
| shared/ | N/A (types only) |
| server/src/game/ | 80%+ |
| client/src/components/ | 70%+ |

## Manual Testing Checklist

### Room Management
- [ ] Create room with valid name
- [ ] Join room with valid code
- [ ] Join room with invalid code → error
- [ ] Join full room → error
- [ ] Leave room → other players notified
- [ ] Host leaves → new host assigned

### Lobby
- [ ] See all players in room
- [ ] See ready status of each player
- [ ] Toggle ready status
- [ ] Copy room code
- [ ] Start button disabled when not all ready
- [ ] Start button enabled when all ready

### Socket Connection
- [ ] Auto-reconnect on disconnect
- [ ] Handle server restart
- [ ] Handle network interruption

## Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Testing

Planned (M2+):
- Latency under 100ms for socket events
- Support for 4 simultaneous games
- Memory usage under 200MB per server instance
