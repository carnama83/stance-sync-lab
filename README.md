# Website V2

A social media platform for capturing public sentiment through AI-generated questions from news events.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Testing**: Jest + Testing Library (unit), Playwright (E2E)
- **Code Quality**: ESLint + Prettier + Husky
- **Accessibility**: axe-core testing
- **Security**: DOMPurify for XSS prevention

## Project Structure

```
/src
  /pages
    /marketing/HomePage.tsx     # Landing page
  /components                  # Reusable UI components
  /features                   # Feature-specific components
  /lib
    /supabase
      client.ts               # Supabase browser client
  /styles                     # Global styles
  /router
    index.tsx                 # React Router setup
/tests
  /unit/                      # Jest + Testing Library tests
  /e2e/                       # Playwright E2E tests
/config
  jest.config.ts              # Jest configuration
  playwright.config.ts        # Playwright configuration
/db
  /migrations/                # Database migration files
/supabase
  /functions/                 # Edge Functions source
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run e2e` - Run E2E tests with Playwright
- `npm run e2e:ui` - Run E2E tests with Playwright UI
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check with TypeScript

## Development Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Install Playwright browsers (for E2E tests):**
   ```bash
   npx playwright install
   ```

4. **Set up git hooks:**
   ```bash
   npm run prepare
   ```

5. **Start development:**
   ```bash
   npm run dev
   ```

## Testing

### Unit Tests
```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### E2E Tests
```bash
npm run e2e              # Headless mode
npm run e2e:ui           # Interactive UI mode
```

### Accessibility Testing
E2E tests include automated accessibility checks using axe-core.

## Code Quality

- **ESLint**: Configured with TypeScript and React rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for linting and formatting
- **TypeScript**: Strict type checking enabled

## Supabase Integration

The project uses Supabase for:
- Database (PostgreSQL with RLS)
- Authentication (when implemented in future steps)
- Edge Functions for server-side logic
- Real-time subscriptions (when needed)

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for Edge Functions

## Roadmap

This is Step 0 (project scaffolding). Upcoming features by Epic:

- **Epic A**: Identity & Onboarding (pseudonymous users)
- **Epic B**: News Ingestion & AI Question Generation
- **Epic C**: Feed & Discovery
- **Epic D**: Stance Capture (slider -2 to +2)
- **Epic F**: Community Analytics & Pulse
- **Epic G**: Discussion & Civility
- **Epic H**: Moderation & Safety

## Contributing

1. Follow the existing code style (enforced by ESLint + Prettier)
2. Write tests for new features
3. Ensure accessibility compliance
4. Update documentation as needed

## Security

- All user input sanitized with DOMPurify
- Environment variables properly scoped (VITE_ prefix for client)
- CSP headers planned for production
- RLS policies will be implemented with database schema