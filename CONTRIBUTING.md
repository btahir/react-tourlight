# Contributing to react-spotlight

Thanks for your interest in contributing! This guide will help you get set up and understand the project workflow.

## Development setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/) (latest)

### Getting started

```bash
# Clone the repository
git clone https://github.com/bilaltahir/react-spotlight.git
cd react-spotlight

# Install dependencies
pnpm install

# Run the test suite
pnpm test:run

# Start the docs site in dev mode
cd apps/docs && pnpm dev
```

## Project structure

```
react-spotlight/
├── src/                    # Library source code
│   ├── components/         # React components (Provider, Tour, Highlight, etc.)
│   ├── hooks/              # Custom hooks (useSpotlight, useSpotlightControl)
│   ├── styles/             # CSS stylesheets
│   ├── utils/              # Shared utilities
│   └── index.ts            # Public API exports
├── tests/                  # Vitest test files
├── apps/
│   └── docs/               # Fumadocs documentation site (Next.js)
├── dist/                   # Build output (git-ignored)
├── biome.json              # Linter & formatter config
├── tsdown.config.ts        # Build config
└── package.json
```

## Available scripts

| Script | Description |
|---|---|
| `pnpm build` | Build the library with tsdown |
| `pnpm dev` | Watch mode for development |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm check` | Lint and format check with Biome |
| `pnpm check:fix` | Auto-fix lint and format issues |
| `pnpm lint:pkg` | Validate package exports with publint and attw |
| `pnpm validate` | Full validation: build + lint:pkg + check + test |

## Making changes

### Workflow

1. Fork the repository and create a branch from `main`
2. Make your changes
3. Run `pnpm validate` to ensure everything passes
4. Create a changeset (see below)
5. Open a pull request

### Code style

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

- **Single quotes**, no semicolons, trailing commas
- **2-space indentation**, 100-char line width
- `console.log` is banned in library source (allowed in tests and config files)
- Imports are auto-organized

Run `pnpm check:fix` to auto-fix issues before committing.

### Testing

Tests use [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/).

- Place test files in the `tests/` directory
- Name test files `*.test.ts` or `*.test.tsx`
- Run `pnpm test` for watch mode during development
- Aim for meaningful tests that cover behavior, not implementation details

### Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelogs.

When your PR includes user-facing changes, add a changeset:

```bash
pnpm changeset
```

This will prompt you for:
1. **Package** — select `react-spotlight`
2. **Bump type** — `patch` (bug fix), `minor` (new feature), or `major` (breaking change)
3. **Summary** — a short description of the change

The changeset file will be committed with your PR and consumed during the release process.

**Skip changesets for:**
- Documentation-only changes
- Test-only changes
- Internal refactors with no public API impact

## Pull request guidelines

- Keep PRs focused on a single concern
- Include a clear description of what changed and why
- Ensure `pnpm validate` passes
- Add tests for new features and bug fixes
- Add a changeset for user-facing changes
- Update documentation if you change the public API

## Reporting issues

Found a bug or have a feature request? [Open an issue](https://github.com/bilaltahir/react-spotlight/issues) with:
- A clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (React version, browser, OS)
