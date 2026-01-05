# Precision Label Architect

A modern, type-safe label printing application built with React, TypeScript, and Vite.

## Features

- 🎨 Visual label designer with drag-and-drop
- 📊 Excel data import and management
- 🖨️ Batch printing capabilities
- 💾 Template management
- 🔐 User authentication
- 📱 Responsive design

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Label-Printing
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 4. Run development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
/
├── core/                 # Core utilities and services
│   ├── config/          # Configuration (env, constants)
│   ├── services/        # Business services (Excel, etc.)
│   └── logger.ts        # Logging utility
├── features/            # Feature modules
│   ├── dashboard/       # Dashboard feature
│   ├── label-designer/  # Label designer feature
│   ├── print-station/   # Print station feature
│   ├── products/        # Product management
│   ├── ui/             # Shared UI components
│   └── users/          # User management
├── .github/            # GitHub Actions workflows
├── public/             # Static assets
└── tests/              # Test files

```

## Technology Stack

- **Framework**: React 19
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions
- **Excel Processing**: ExcelJS

## Development Guidelines

### Code Style

- Follow TypeScript strict mode guidelines
- Use functional components with hooks
- Implement proper error handling
- Write tests for critical paths
- Use meaningful variable names
- Add JSDoc comments for complex logic

### Commit Convention

We use conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### Testing

- Write unit tests for utilities and services
- Write integration tests for features
- Aim for 70%+ code coverage
- Test edge cases and error scenarios

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

1. **Code Quality**: Type checking, linting, formatting
2. **Tests**: Unit and integration tests with coverage
3. **Build**: Production build verification
4. **Security**: Automated dependency scanning (Dependabot)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all checks pass
5. Submit a pull request

## Troubleshooting

### Build Errors

If you encounter TypeScript errors after pulling changes:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment Issues

Ensure all required environment variables are set in `.env.local`. See `.env.example` for reference.

### Test Failures

Run tests in watch mode to debug:

```bash
npm test
```

## License

[Your License Here]

## Support

For issues and questions, please create an issue in the repository.
