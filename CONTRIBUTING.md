# Contributing to zod-to-drizzle

First off, thanks for taking the time to contribute! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies:
```bash
bun install
```

## Development Process

1. Create a new branch:
```bash
git checkout -b feat/your-feature
# or
git checkout -b fix/your-fix
```

2. Make your changes

3. Run tests:
```bash
bun test
```

4. Run type check:
```bash
bun run typecheck
```

5. Format code:
```bash
bun run format
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages should follow this pattern:

- `feat: add support for X`
- `fix: resolve issue with Y`
- `docs: update README`
- `chore: update dependencies`
- `refactor: improve type handling`
- `test: add tests for Z`

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the tests if needed
3. Ensure all tests pass
4. Link any related issues
5. The PR will be merged once you have the sign-off

## Code Style

- Use TypeScript
- Follow existing code style (Prettier)
- Write tests for new features

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License. 