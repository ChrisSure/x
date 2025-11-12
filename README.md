# NodeJS + TypeScript Project

A production-ready Node.js project with TypeScript, ESLint, Prettier, Jest, and GitHub Actions CI/CD.

## Features

- 🚀 **TypeScript** - Strict type checking with latest features
- 🎨 **ESLint** - Code linting with TypeScript support
- ✨ **Prettier** - Consistent code formatting
- 🧪 **Jest** - Unit testing with coverage reporting
- 🔄 **GitHub Actions** - Automated CI/CD pipeline
- 📦 **Modern Node.js** - Built for Node.js 20+ with ES2022 features

## Prerequisites

- Node.js 20.x or higher (22.x recommended)
- npm (comes with Node.js)

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Build the project
npm run build

# Run the built project
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format
```

### Clean Build

```bash
# Clean build artifacts
npm run clean

# Clean and rebuild
npm run prebuild && npm run build
```

## Project Structure

```
.
├── .github/
│   └── workflows/       # GitHub Actions workflows
├── src/                 # Source files
│   └── index.ts        # Entry point
├── tests/              # Test files
│   └── index.test.ts   # Sample tests
├── dist/               # Compiled output (generated)
├── coverage/           # Test coverage reports (generated)
├── .cursorrules        # Cursor IDE rules
├── tsconfig.json       # TypeScript configuration
├── jest.config.js      # Jest configuration
├── eslint.config.js    # ESLint configuration
├── .prettierrc         # Prettier configuration
├── .nvmrc             # Node.js version specification
└── package.json       # Project dependencies and scripts
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run development server with tsx |
| `npm start` | Run compiled JavaScript |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is formatted |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## CI/CD

The project includes a GitHub Actions workflow that automatically:

- ✅ Checks if the project builds successfully
- ✅ Runs ESLint to check code quality
- ✅ Verifies Prettier formatting
- ✅ Runs all unit tests with coverage reporting
- ✅ Tests on multiple Node.js versions (20.x and 22.x)

The workflow runs on:
- Push to `main`, `master`, or `develop` branches
- Pull requests targeting these branches

## TypeScript Configuration

The project uses strict TypeScript configuration with:

- Strict mode enabled
- ES2022 target
- CommonJS modules
- Source maps for debugging
- Declaration files generation
- Path aliases support (`@/*` → `src/*`)

## ESLint Configuration

ESLint is configured with:

- TypeScript ESLint plugin
- Prettier integration
- Strict type-checking rules
- Node.js environment
- Custom rules for code quality

## Prettier Configuration

Prettier is configured with:

- Single quotes
- Semicolons
- 2-space indentation
- 100 character line width
- LF line endings
- ES5 trailing commas

## Jest Configuration

Jest is configured with:

- ts-jest preset for TypeScript
- Node.js test environment
- Coverage reporting (text, lcov, html)
- Tests located in `tests/` directory
- Source coverage from `src/` directory

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Author

Your Name

---

**Built with ❤️ using Node.js and TypeScript**

