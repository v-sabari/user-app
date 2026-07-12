# Contributing to Day4

First off, thank you for considering contributing to Day4! It's people like you that make Day4 such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**
* **Include your environment details** (OS, Java version, Spring Boot version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Follow the JavaScript/Java styleguides
* End all files with a newline
* Include appropriate test cases
* Update documentation as needed

## Development Setup

### Prerequisites

- Java 21 or later
- Node.js 18 or later
- Maven 3.8.1 or later
- PostgreSQL 16 or later (or Neon account)
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/day4-backend.git
cd day4-backend

# Create application-dev.properties for local development
cat > src/main/resources/application-dev.properties << EOF
spring.datasource.url=jdbc:postgresql://localhost:5432/day4_dev
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=create-drop
logging.level.com.example=DEBUG
EOF

# Build project
mvn clean install -DskipTests

# Run with development profile
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/day4-frontend.git
cd day4-frontend

# Install dependencies
npm install

# Create .env.local for development
cat > .env.local << EOF
VITE_API_URL=http://localhost:8080
EOF

# Start development server
npm run dev
```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Example:
```
Add JWT refresh token rotation

Implements automatic token refresh every 15 minutes
and invalidates expired tokens. Includes new endpoint
/auth/refresh for manual token refresh.

Fixes #123
Closes #456
```

### Java Styleguide

All Java code must follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html):

* Use 4 spaces for indentation
* Use camelCase for variable names
* Use UPPER_SNAKE_CASE for constants
* Maximum line length: 100 characters
* Add Javadoc comments for public classes and methods

```java
/**
 * Validates user credentials and generates JWT token.
 *
 * @param request the authentication request containing email and password
 * @return response with JWT token and user details
 * @throws InvalidCredentialsException if credentials are invalid
 */
@PostMapping("/login")
public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
    // Implementation
}
```

### JavaScript/React Styleguide

All JavaScript code must follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript):

* Use const by default
* Use arrow functions instead of function declarations
* Use template literals for string interpolation
* Maximum line length: 100 characters

```javascript
/**
 * Fetches user profile from API
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} User profile data
 */
const fetchUserProfile = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
```

### SQL Styleguide

* Use UPPERCASE for SQL keywords
* Use snake_case for table and column names
* Add comments for complex queries
* Always use parameterized queries (handled by JPA)

```sql
-- Find active users created in last 30 days
SELECT user_id, email, created_at
FROM users
WHERE is_active = true
AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## Testing

### Unit Tests

All new features must include unit tests:

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=UserServiceTest

# Run with coverage report
mvn jacoco:report
```

### Integration Tests

For features affecting database or external services:

```bash
# Run integration tests
mvn verify

# With Spring Boot test profile
mvn test -Dspring.profiles.active=test
```

### Load Testing

Before submitting PR with performance-related changes:

```bash
# Run baseline load test
k6 run load-test.js

# Run stress test
k6 run stress-test.js

# Compare results with baseline
```

## Documentation

### API Documentation

When adding new endpoints:

1. Update [docs/API.md](./docs/API.md)
2. Add Javadoc comments to controller methods
3. Include request/response examples
4. Document error responses

### Changelog

Update [CHANGELOG.md](./CHANGELOG.md) with:

```markdown
## [Unreleased]

### Added
- New JWT refresh token rotation feature
- Health check endpoint for monitoring

### Fixed
- Fixed rate limiting bypass vulnerability
- Fixed database connection pool exhaustion

### Changed
- Updated Spring Boot to 3.3.13
```

## Pull Request Process

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, atomic commits

3. **Write or update tests** for your changes

4. **Run the full test suite locally**
   ```bash
   mvn clean verify
   npm run lint
   ```

5. **Update documentation** if needed

6. **Push to your fork** and create a Pull Request

7. **Fill out the PR template** completely

8. **Request review** from maintainers

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues
Fixes #(issue number)
Relates to #(issue number)

## Testing
Describe testing you've done:
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Performance Impact
- [ ] No impact expected
- [ ] Performance improvement
- [ ] Performance regression (explain in detail)

## Security Considerations
- [ ] No security impact
- [ ] Security improvement
- [ ] Security concerns (explain in detail)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests passed locally with my changes
```

## Review Process

### Maintainer Review

- Code quality and style adherence
- Test coverage and quality
- Documentation accuracy
- Security implications
- Performance impact

### Approval Criteria

A PR can be merged when:
- ✅ At least 2 approvals from maintainers
- ✅ All CI checks passing
- ✅ No unresolved conversations
- ✅ Updated documentation
- ✅ Code coverage maintained or improved

## Additional Notes

### Issue and Pull Request Labels

| Label | Meaning |
|-------|---------|
| `good first issue` | Good for newcomers |
| `documentation` | Improvements or additions to documentation |
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `performance` | Performance related |
| `security` | Security related |
| `help wanted` | Extra attention is needed |
| `wontfix` | This will not be worked on |

### Getting Help

- **Documentation**: Check [docs/](./docs/) directory
- **Community**: Join our [Discord server](https://discord.gg/example)
- **Questions**: Open a [Discussion](https://github.com/yourusername/day4/discussions)

## Attribution

This CONTRIBUTING.md was inspired by [Atom project](https://github.com/atom/atom) and [Rails project](https://github.com/rails/rails) contributing guidelines.

---

**Thank you for contributing to Day4! 🙌**
