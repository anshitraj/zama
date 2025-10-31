# Contributing to Private Transaction Tracker

Thank you for your interest in contributing! This document provides guidelines and standards for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## 🤝 Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/private-transaction-tracker.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL_OWNER/private-transaction-tracker.git`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## 💻 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Development Process

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/add-csv-export
   ```

2. Make your changes following code style guidelines

3. Test your changes:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. Commit with conventional commits (see below)

5. Push to your fork:
   ```bash
   git push origin feature/add-csv-export
   ```

6. Open a Pull Request to `develop` branch

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Scopes

- `ui`: User interface components
- `fhe`: FHE-related code
- `ipfs`: IPFS integration
- `contract`: Smart contract interactions
- `i18n`: Internationalization
- `deps`: Dependencies
- `config`: Configuration files

### Examples

```bash
feat(ui): add dark mode toggle
fix(fhe): correct encryption key derivation
docs(readme): update IPFS integration instructions
refactor(contract): optimize gas usage in attestExpense
test(fhe): add unit tests for encryption functions
chore(deps): upgrade wagmi to v2.0.0
```

### Best Practices

- Use imperative mood: "add" not "added" or "adds"
- Keep subject line under 72 characters
- Reference issues in footer: `Closes #123`
- Break changes: `BREAKING CHANGE: ` in footer

## 🎨 Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for objects
- Use explicit return types for functions
- No `any` types (use `unknown` if needed)

```typescript
// ✅ Good
interface ExpensePayload {
  amount: number;
  category: string;
}

export async function encryptExpense(payload: ExpensePayload): Promise<EncryptedResult> {
  // ...
}

// ❌ Bad
export async function encryptExpense(payload: any) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Prefer named exports for components
- Co-locate types with components
- Use semantic HTML elements

```tsx
// ✅ Good
interface ExpenseCardProps {
  expense: Expense;
  onDecrypt?: () => void;
}

export function ExpenseCard({ expense, onDecrypt }: ExpenseCardProps) {
  return (
    <article>
      <h3>{expense.category}</h3>
      {/* ... */}
    </article>
  );
}

// ❌ Bad
export default function Card(props: any) {
  return <div>{props.data}</div>;
}
```

### CSS/Tailwind

- Use semantic design tokens from `src/index.css`
- Avoid inline colors (use theme variables)
- Prefer utility classes over custom CSS
- Use responsive classes

```tsx
// ✅ Good
<Button className="bg-primary hover:bg-primary/90 transition-smooth">
  Submit
</Button>

// ❌ Bad
<Button style={{ backgroundColor: '#a855f7' }}>
  Submit
</Button>
```

### File Naming

- Components: PascalCase (`ExpenseCard.tsx`)
- Utilities: camelCase (`fhe.ts`)
- Pages: PascalCase (`Dashboard.tsx`)
- Types: camelCase (`expense.ts`)

### Formatting

We use Prettier for code formatting:

```bash
npm run format
```

**Prettier config** (`.prettierrc`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## 🧪 Testing

### Unit Tests

Write unit tests for:
- Utility functions (FHE, IPFS, contract helpers)
- Complex hooks
- State management logic

```typescript
// src/lib/__tests__/fhe.test.ts
import { describe, it, expect } from 'vitest';
import { computeSubmissionHash } from '../contract';

describe('Contract utilities', () => {
  it('should compute correct submission hash', () => {
    const cid = 'QmTest123';
    const hash = computeSubmissionHash(cid);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
```

Run tests:
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests

Write E2E tests for critical user flows:
- Wallet connection
- Expense submission
- Event reading
- Verification

```typescript
// cypress/e2e/expense-submission.cy.ts
describe('Expense Submission', () => {
  it('should submit and attest expense', () => {
    cy.visit('/');
    cy.connectWallet();
    cy.findByRole('button', { name: /add expense/i }).click();
    cy.findByLabelText(/amount/i).type('100');
    cy.findByRole('button', { name: /submit/i }).click();
    cy.findByText(/expense added successfully/i).should('be.visible');
  });
});
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] Tests pass: `npm run test`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in dev mode
- [ ] Updated relevant documentation
- [ ] Added/updated tests if applicable

### PR Title

Follow conventional commit format:

```
feat(ui): add CSV export functionality
```

### PR Description Template

```markdown
## 🎯 Purpose
Brief description of what this PR does

## 🔧 Changes
- Added CSV export button to dashboard
- Created utility function for data serialization
- Updated translations for export feature

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## 📸 Screenshots (if UI changes)
[Add screenshots or GIFs]

## 📝 Notes
Any additional context or decisions made

## 🔗 Related Issues
Closes #123
Refs #456
```

### Review Process

1. Automated checks must pass (tests, linting, build)
2. At least one maintainer approval required
3. Address review comments
4. Maintainer will merge when ready

### After Merge

1. Delete your feature branch
2. Update your local `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   ```

## 🏗️ Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── ...            # Custom components
├── pages/             # Route pages
├── lib/               # Utility functions
│   ├── fhe.ts         # FHE stubs
│   ├── ipfs.ts        # IPFS helpers
│   └── contract.ts    # Contract ABIs and helpers
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── i18n/              # Internationalization
│   └── locales/       # Translation files
├── config/            # Configuration files
└── assets/            # Static assets
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [wagmi Documentation](https://wagmi.sh/)
- [Zama FHE Docs](https://docs.zama.ai/)

## ❓ Questions?

- Open a [Discussion](https://github.com/OWNER/REPO/discussions)
- Join [Zama Discord](https://discord.com/invite/fhe-org)
- Check existing [Issues](https://github.com/OWNER/REPO/issues)

## 🙏 Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!
