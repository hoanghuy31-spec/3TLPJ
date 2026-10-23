# CLAUDE.md - AI Assistant Context

## Project Overview

This is a realtime multiplayer card game (UNO-like) built with:
- **Client**: React 18 + Vite + TypeScript
- **Server**: Node.js + Express + Socket.IO + TypeScript
- **Shared**: TypeScript types and constants
- **Testing**: Vitest
- **Monorepo**: npm workspaces

## Key Commands

```bash
# Install dependencies
npm install

# Development (runs both client & server)
npm run dev

# Build all packages
npm run build

# Run tests
npm test

# Run lint
npm run lint

# Clean node_modules
npm run clean
```

## Project Documentation

- [ROADMAP.md](ROADMAP.md) - Development roadmap with milestones M0-M3
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [docs/CODE_MAP.md](docs/CODE_MAP.md) - Complete export map of all packages

## Architecture

- `client/` - React frontend (port 5173)
- `server/` - Express + Socket.IO backend (port 3001)
- `shared/` - Shared types, constants, and game config

## Important Conventions

### Socket.IO Events

All events are defined in `shared/src/constants.ts` under `SOCKET_EVENTS`.
Use these constants instead of magic strings.

### Game Logic

Game logic (deck, shuffle, deal) is in `server/src/game/`.
This module is pure and has no Socket.IO dependencies for easy testing.

### Shared Types

All types used by both client and server go in `shared/src/types.ts`.
Import from `@uno/shared` in both packages.

## Code Style

- TypeScript strict mode enabled
- Prefer interfaces for object shapes
- Use `const` for immutable data
- Follow ESLint/Prettier rules

## Testing Strategy

- Unit tests for game logic (`server/src/game/*.test.ts`)
- Component tests for React components (`client/src/components/*.test.tsx`)
- Shared types don't need tests

## Current Status (M0 - Skeleton)

The current M0 milestone includes:
- Basic project structure
- Room creation/joining
- Lobby with player list
- Basic deck/shuffle/deal logic
- Unit tests for game module

Planned for M1+:
- Complete game rules
- Card playing logic
- Turn management
- UNO call system
- Score tracking
