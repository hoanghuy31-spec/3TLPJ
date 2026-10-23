# Contributing to UNO-like Card Game

Thank you for your interest in contributing! Please follow these guidelines.

## Branch Naming

- `feature/` - New features (e.g., `feature/card-animation`)
- `fix/` - Bug fixes (e.g., `fix/room-join-error`)
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, white-space
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build process, dependencies

### Examples

```
feat(lobby): add ready button state
fix(room): handle player disconnect properly
docs(api): add socket event documentation
test(deck): add shuffle verification tests
```

## Pull Request Process

1. Create a new branch from `main`
2. Make your changes following the code conventions
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Ensure lint passes: `npm run lint`
6. Update documentation if needed
7. Submit a PR with a clear description

## Definition of Done

A feature/fix is considered complete when:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass
- [ ] Lint checks pass
- [ ] New functionality has tests
- [ ] Documentation is updated (if applicable)
- [ ] No console.log statements in production code
- [ ] Types are properly defined (no `any` without justification)

## Code Conventions

### TypeScript

- Use explicit types; avoid `any` when possible
- Use interfaces for object shapes
- Use type aliases for unions and intersections
- Export types from `shared/` for cross-package use

### React Components

- Functional components only
- Use hooks for state management
- Keep components small and focused
- Co-locate tests with components

### File Organization

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── types/          # Local type definitions
└── ...
```

## Running Tests

```bash
# All tests
npm test

# Specific package
npm test --workspace=shared
npm test --workspace=server
npm test --workspace=client
```

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions
