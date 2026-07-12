# Day5 - Backend API

[![Spring Boot 3.3](https://img.shields.io/badge/spring%20boot-3.3.13-green?logo=spring)](https://spring.io/projects/spring-boot)
[![Java 21](https://img.shields.io/badge/java-21-orange?logo=java)](https://www.java.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Render](https://img.shields.io/badge/deployed-render-46E3B7)](https://day4-backend-lhwf.onrender.com)
[![Live](https://img.shields.io/badge/status-live-green)](https://day4-backend-lhwf.onrender.com/api/health)

Spring Boot 3.3 REST API backend for User Management platform. Deployed on Render with PostgreSQL database on Neon. Load tested for 300+ concurrent users.

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Maven 3.8.1+
- PostgreSQL 16+ (or Neon account)
- Git

### Local Development

```bash
# Clone and navigate
git clone https://github.com/YOUR_USERNAME/user-app.git
cd user-app/day5

# Build project
mvn clean install

# Create local database
createdb day4_dev

# Set environment variables
export DATABASE_URL=jdbc:postgresql://localhost:5432/day4_dev
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=your_password

# Run application
mvn spring-boot:run

# API available at http://localhost:8080
# Health check: http://localhost:8080/api/health
```

## 📁 Project Structure

```
day5/
├── src/
│   ├── main/
│   │   ├── java/com/example/day4/
│   │   │   ├── controllers/     # REST endpoints
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Database access
│   │   │   ├── entities/        # JPA entities
│   │   │   ├── dto/             # Data transfer objects
│   │   │   ├── security/        # Security config
│   │   │   ├── exception/       # Exception handlers
│   │   │   ├── util/            # Utilities
│   │   │   └── Day4Application.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       ├── logback-spring.xml
│   │       └── db/migration/    # Flyway migrations
│   └── test/
│       └── java/com/example/day4/
│           ├── controllers/
│           ├── services/
│           └── integration/
├── pom.xml                      # Maven dependencies
├── Dockerfile                   # Container config
├── docker-compose.yml           # Local environment
├── README.md                    # This file
└── CONTRIBUTING.md             # Code guidelines
```

## ⚙️ Configuration

### Environment Variables

Required for production:

```env
# Database (Neon)
DATABASE_URL=jdbc:postgresql://host:5432/dbname?sslmode=require
DATABASE_USERNAME=user
DATABASE_PASSWORD=password

# API Configuration
SERVER_PORT=8080

# Frontend
FRONTEND_URL=https://user-app-delta-pearl.vercel.app

# Error Tracking
SENTRY_DSN=https://key@sentry.io/project

# Email Service
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=app_password

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Database Configuration

#### Local Development
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/day4_dev
spring.datasource.username=postgres
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=create-drop
```

#### Production (Neon)
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
```

## 🏗️ Architecture

### Layered Architecture
```
Controllers (REST Endpoints)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database (PostgreSQL)
```

### 74 Java Components
- 12 Controllers (REST endpoints)
- 15 Services (business logic)
- 12 Repositories (JPA)
- 18 Entities (JPA models)
- 10 DTOs (data transfer)
- 5 Security components
- 2 Exception handlers

## 📡 API Endpoints

### Authentication
```
POST   /auth/register           - Register user
POST   /auth/login              - Login (returns JWT)
POST   /auth/refresh            - Refresh access token
POST   /auth/logout             - Logout
POST   /auth/forgot-password    - Request reset
POST   /auth/reset-password     - Reset password
POST   /auth/verify-2fa         - Verify 2FA
```

### Users
```
GET    /api/users               - List all users (paginated)
GET    /api/users/{id}          - Get user details
PUT    /api/users/{id}          - Update user
DELETE /api/users/{id}          - Delete user
POST   /api/users/bulk          - Bulk operations
GET    /api/profile             - Current user profile
PUT    /api/profile             - Update profile
```

### Admin
```
GET    /admin/dashboard         - Dashboard stats
GET    /admin/audit-logs        - Audit logs
GET    /admin/users/sessions    - User sessions
POST   /admin/alerts            - Create alerts
```

### Monitoring
```
GET    /api/health              - Health check (public)
GET    /actuator/metrics        - Metrics
GET    /actuator/health/live    - Liveness probe
GET    /actuator/health/ready   - Readiness probe
```

## 🔐 Security

### Implemented Features
- ✅ JWT authentication (15-min expiration)
- ✅ Refresh tokens (7-day expiration)
- ✅ Role-based access control (USER, ADMIN, SYSTEM)
- ✅ 2FA with TOTP
- ✅ Password hashing (bcrypt, strength 12)
- ✅ Rate limiting (100 req/min)
- ✅ CORS configuration
- ✅ CSRF protection ready
- ✅ Audit logging
- ✅ Brute force protection

### Security Audit Results
**Day 56-60:**
- ✅ 8/8 Controllers Audited
- ✅ 3 Vulnerabilities Found & Fixed
- ✅ 0 Critical Issues
- ✅ OWASP Top 10 Compliant

### Securing Endpoints

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        // Only ADMIN role can access
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        // USER and ADMIN can access
    }
}
```

## 📊 Performance

### Load Testing Results (Days 91-96)

| Test | Result | Status |
|------|--------|--------|
| Baseline (50 users) | 100% success | ✅ |
| Stress (300 users) | 100% success | ✅ |
| DB Connection (150 users) | 100% success | ✅ |
| Graceful Shutdown | 30s timeout | ✅ |
| Health Check (200 users) | 0% failures | ✅ |
| Circuit Breaker | 98.65% success | ✅ |

### Optimization Features
- Connection pooling (HikariCP: 20 max)
- Query optimization via JPA
- Caching strategies
- Async logging
- Batch database operations
- Graceful shutdown (30 seconds)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=UserServiceTest

# Run with coverage
mvn jacoco:report

# Run integration tests
mvn verify
```

### Test Structure

```
src/test/java/com/example/day4/
├── controllers/
│   └── UserControllerTest.java
├── services/
│   └── UserServiceTest.java
├── repositories/
│   └── UserRepositoryTest.java
└── integration/
    └── ApiIntegrationTest.java
```

### Test Example

```java
@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testGetAllUsers() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size()").value(greaterThan(0)));
    }
}
```

## 🚀 Deployment

### Render Deployment (Current)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Render
# - Dashboard: https://dashboard.render.com
# - Create Web Service
# - Connect GitHub repository
# - Set environment variables
# - Deploy automatically

# 3. Verify
curl https://day4-backend-lhwf.onrender.com/api/health
```

### Docker Deployment

```bash
# Build Docker image
docker build -t day4-backend .

# Run container locally
docker run -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://db:5432/day4 \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=password \
  day4-backend

# Or use docker-compose
docker-compose up
```

### Environment Files

**application.properties** (defaults)
```properties
spring.application.name=day4
server.port=${PORT:8080}
```

**application-dev.properties** (local)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/day4_dev
spring.jpa.hibernate.ddl-auto=create-drop
logging.level.com.example=DEBUG
```

**application-prod.properties** (production)
```properties
spring.datasource.url=${DATABASE_URL}
spring.jpa.hibernate.ddl-auto=update
logging.level.root=WARN
```

## 📚 Database

### Schema
- **users** - User accounts
- **roles** - Role definitions
- **user_roles** - User-role mapping
- **audit_logs** - Audit trail
- **login_history** - Login attempts
- **password_reset_tokens** - Reset tokens
- **sessions** - User sessions
- And 8+ more tables

### Migrations

Using Flyway for database versioning:

```
db/migration/
├── V1__initial_schema.sql
├── V2__add_audit_logs.sql
└── V3__add_2fa_support.sql
```

### Backup & Restore

```bash
# Backup (Neon)
pg_dump -U username -h host database > backup.sql

# Restore
psql -U username -h host database < backup.sql
```

## 🔗 Integrations

### Email Service (Gmail)
```java
mailService.sendEmail(
    to: "user@example.com",
    subject: "Welcome",
    template: "welcome.html"
);
```

### SMS Service (Twilio)
```java
smsService.sendSMS(
    phoneNumber: "+1234567890",
    message: "Your OTP is 123456"
);
```

### Error Tracking (Sentry)
```java
Sentry.captureException(exception);
```

## 🛠️ Development

### Code Style
- Follow Google Java Style Guide
- Use meaningful variable names
- Add Javadoc for public methods
- Keep methods focused
- Use dependency injection

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-endpoint

# Make changes with tests
mvn test

# Commit clearly
git commit -m "Add new endpoint for feature X"

# Push and create PR
git push origin feature/new-endpoint
```

### Debugging

```bash
# Enable debug logging
mvn spring-boot:run -Dspring-boot.run.arguments="--debug"

# Use IDE debugger
# VS Code: Debug > Java Debug Server Extension
# IntelliJ: Run > Debug
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -h localhost -U postgres -c "SELECT 1"

# Verify environment variables
echo $DATABASE_URL

# Check logs
tail -f logs/application.log
```

### Port Already in Use
```bash
# Use different port
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=9090"
```

### Dependency Issues
```bash
# Clear Maven cache
mvn clean
rm -rf ~/.m2/repository

# Rebuild
mvn install
```

## 📞 Support

- **Issues**: Create GitHub issue
- **Documentation**: See README files
- **Security**: See SECURITY.md
- **Backend API**: https://day4-backend-lhwf.onrender.com
- **Health Check**: https://day4-backend-lhwf.onrender.com/api/health

## 📄 License

MIT License - See [LICENSE](../LICENSE)

---

**Live API**: https://day4-backend-lhwf.onrender.com  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: July 11, 2026
