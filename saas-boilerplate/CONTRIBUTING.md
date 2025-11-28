# Contributing to SaaS Boilerplate

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect:

- **Be respectful**: Treat everyone with respect
- **Be collaborative**: Work together towards common goals
- **Be inclusive**: Welcome people of all backgrounds
- **Be professional**: Focus on constructive feedback

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Python**: 3.11 or higher
- **Node.js**: 20 or higher
- **Docker**: Latest stable version
- **Git**: Latest stable version
- **GitHub CLI**: `gh` (optional but recommended)

### Fork and Clone

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/saas-boilerplate.git
   cd saas-boilerplate
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/saas-boilerplate.git
   ```

4. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   pip install -e .
   pip install -e .[dev]

   # Frontend
   cd ../frontend
   npm ci
   ```

### Set Up Pre-commit Hooks

We use pre-commit hooks to maintain code quality:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
cd saas-boilerplate
pre-commit install

# Test hooks (optional)
pre-commit run --all-files
```

### Local Development Setup

Follow the [Quick Start Guide](QUICKSTART_CI_CD.md) for complete local setup.

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Sync with upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clear, concise code
- Follow our coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Run Tests Locally

Before pushing, ensure all tests pass:

```bash
# Backend tests
cd backend
ruff check .                    # Linting
ruff format --check .           # Format check
mypy apps config                # Type checking
pytest                          # Unit tests

# Frontend tests
cd frontend
npm run lint                    # ESLint
npx tsc --noEmit               # Type check
npm test                        # Unit tests
npm run test:e2e:quick         # Quick E2E tests
```

### 4. Commit Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: Add user profile avatar upload"
```

**Commit message format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```bash
feat(auth): Add two-factor authentication
fix(billing): Correct subscription renewal calculation
docs(api): Update authentication endpoint documentation
refactor(organizations): Simplify member invitation flow
```

### 5. Push Changes

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Create a PR using GitHub or the CLI:

```bash
gh pr create --title "feat: Your feature title" --body "Description"
```

Or visit: `https://github.com/YOUR_USERNAME/saas-boilerplate/compare`

---

## Coding Standards

### Python (Backend)

**Style Guide**: Follow [PEP 8](https://pep8.org/) and [Django best practices](https://docs.djangoproject.com/en/stable/internals/contributing/writing-code/coding-style/)

**Linting and Formatting**:
- Use **Ruff** for linting and formatting
- Configuration in `backend/pyproject.toml`

**Type Hints**:
- Add type hints to all function signatures
- Use `mypy` for type checking

**Example**:
```python
from typing import Optional
from django.contrib.auth.models import User


def get_user_by_email(email: str) -> Optional[User]:
    """
    Retrieve a user by email address.

    Args:
        email: User's email address

    Returns:
        User object if found, None otherwise
    """
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None
```

**Best Practices**:
- Use Django ORM, avoid raw SQL
- Keep views thin, logic in models/services
- Use Django's built-in security features
- Document complex business logic

### TypeScript/React (Frontend)

**Style Guide**: Follow [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)

**Linting and Formatting**:
- Use **ESLint** for linting
- Use **Prettier** for formatting (via ESLint)
- Configuration in `frontend/eslint.config.js`

**Type Safety**:
- Always use TypeScript, avoid `any` types
- Define proper interfaces for props and state

**Example**:
```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
}) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage message="User not found" />;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      {/* Component content */}
    </div>
  );
};
```

**Best Practices**:
- Use functional components with hooks
- Keep components small and focused
- Use React Query for server state
- Use Zustand for client state
- Implement proper error boundaries

### General Guidelines

- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **SOLID**: Follow SOLID principles
- Write self-documenting code
- Comment complex logic only
- Keep functions small (< 50 lines)
- Use meaningful variable names

---

## Testing Requirements

### Backend Tests

**Required**:
- Unit tests for all new functions/methods
- Integration tests for API endpoints
- Test coverage > 80% for new code

**Example**:
```python
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_user_creation():
    """Test user can be created with email."""
    user = User.objects.create_user(
        email='test@example.com',
        password='secure_password'
    )
    assert user.email == 'test@example.com'
    assert user.check_password('secure_password')


@pytest.mark.django_db
def test_user_cannot_have_duplicate_email():
    """Test email uniqueness constraint."""
    User.objects.create_user(
        email='test@example.com',
        password='password'
    )

    with pytest.raises(Exception):
        User.objects.create_user(
            email='test@example.com',
            password='password'
        )
```

### Frontend Tests

**Required**:
- Unit tests for utility functions
- Component tests for UI components
- Integration tests for complex features
- E2E tests for critical user flows

**Example**:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user information', async () => {
    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('allows editing profile', async () => {
    const onUpdate = vi.fn();
    render(<UserProfile userId="123" onUpdate={onUpdate} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    // Assert edit mode is active
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });
});
```

### E2E Tests

Tag tests appropriately:

```typescript
// Quick smoke test - runs on every PR
test('@quick should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SaaS/);
});

// Full test - runs on push to main
test('should complete full checkout flow', async ({ page }) => {
  // Comprehensive test
});
```

### Running Tests

```bash
# Backend
cd backend
pytest                          # All tests
pytest -v                       # Verbose
pytest --cov=apps               # With coverage
pytest -k test_user             # Specific test

# Frontend
cd frontend
npm test                        # Unit tests
npm run test:e2e:quick         # Quick E2E
npm run test:e2e               # Full E2E
npm run test:coverage          # With coverage
```

---

## Submitting Changes

### Pull Request Guidelines

1. **Fill out the PR template completely**
2. **Link related issues**: Use `Closes #123` or `Fixes #456`
3. **Add screenshots**: For UI changes
4. **Update documentation**: If needed
5. **Ensure CI passes**: All checks must be green

### PR Title Format

```
<type>(<scope>): <description>
```

Examples:
- `feat(auth): Add password reset functionality`
- `fix(billing): Correct tax calculation for EU customers`
- `docs(api): Update authentication examples`

### What to Include

- **Clear description**: What and why
- **Test coverage**: New tests added
- **Breaking changes**: Documented if applicable
- **Migration guide**: If breaking changes
- **Screenshots**: For visual changes

### What NOT to Do

- ❌ Submit without running tests
- ❌ Include unrelated changes
- ❌ Commit commented-out code
- ❌ Push merge commits (rebase instead)
- ❌ Force push to PR after review started

---

## Review Process

### Review Timeline

- **Initial review**: Within 2 business days
- **Follow-up reviews**: Within 1 business day
- **Merge**: After approval + CI passes

### Review Criteria

Reviewers will check:

1. **Code Quality**
   - Follows coding standards
   - No obvious bugs or issues
   - Proper error handling
   - Security considerations

2. **Tests**
   - Adequate test coverage
   - Tests are meaningful
   - All tests pass

3. **Documentation**
   - Code is well-documented
   - API docs updated if needed
   - CHANGELOG updated for significant changes

4. **Performance**
   - No obvious performance issues
   - Database queries optimized
   - Proper caching considered

5. **Security**
   - No security vulnerabilities
   - Proper authentication/authorization
   - Input validation
   - No exposed secrets

### Addressing Feedback

1. **Be responsive**: Reply to comments
2. **Be open**: Consider all feedback
3. **Be collaborative**: Discuss disagreements
4. **Make changes**: Push additional commits
5. **Request re-review**: After addressing all feedback

### After Approval

1. **Squash and merge**: Preferred method
2. **Update branch**: If needed before merge
3. **Delete branch**: After merge

---

## Additional Resources

### Documentation

- [CI/CD Guide](CI_CD.md) - Complete CI/CD documentation
- [Quick Start](QUICKSTART_CI_CD.md) - 30-minute setup guide
- [Setup Checklist](SETUP_CHECKLIST.md) - Comprehensive setup
- [Deployment Runbook](DEPLOYMENT_RUNBOOK.md) - Deployment procedures
- [Monitoring Guide](MONITORING.md) - Monitoring and alerting

### External Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Playwright Documentation](https://playwright.dev/)

### Getting Help

- **Documentation**: Check docs first
- **GitHub Issues**: Search existing issues
- **Discussions**: Ask in GitHub Discussions
- **Team Chat**: Reach out in Slack/Discord

---

## Recognition

Contributors will be:
- Listed in CHANGELOG for significant contributions
- Mentioned in release notes
- Added to CONTRIBUTORS.md (if they wish)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to make this project better! 🎉
