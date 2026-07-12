# User App - Full-Stack User Management Platform

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/react-19.2.4-blue?logo=react)](https://react.dev/)
[![Spring Boot 3.3](https://img.shields.io/badge/spring%20boot-3.3.13-green?logo=spring)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Production Ready](https://img.shields.io/badge/status-production%20ready-success)](#)

A production-grade full-stack user management platform built over 100 days of development. Demonstrates enterprise-grade security, performance optimization, and modern development practices.

## 📁 Repository Structure

```
user-app/
├── day4/                 # Frontend (React 19 + Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── README.md         ← Read first
│   └── CONTRIBUTING.md
│
├── day5/                 # Backend (Spring Boot 3.3)
│   ├── src/
│   ├── pom.xml
│   ├── application.properties
│   ├── README.md         ← Read first
│   └── CONTRIBUTING.md
│
├── README.md             # This file
├── CONTRIBUTING.md       # How to contribute
├── SECURITY.md          # Security policy
├── CODE_OF_CONDUCT.md   # Community guidelines
├── LICENSE              # MIT License
└── ROADMAP.md           # Future plans
```

## 🚀 Quick Start

### For Frontend Developers
```bash
cd day4
npm install
npm run dev
# Open http://localhost:5173
```

### For Backend Developers
```bash
cd day5
mvn clean install
mvn spring-boot:run
# Server runs on http://localhost:8080
```

### Full Stack Setup
```bash
# Terminal 1: Frontend
cd day4
npm install
npm run dev

# Terminal 2: Backend (in new terminal)
cd day5
export DATABASE_URL=jdbc:postgresql://localhost:5432/day4_dev
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=your_password
mvn spring-boot:run

# Terminal 3: Access
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# API Health: http://localhost:8080/api/health
```

## 📂 Project Structure

### Frontend (`day4/`)
- **Technology**: React 19, Vite, React Router 7
- **Build**: `npm run build` → Production-optimized bundle
- **Deployment**: Vercel CDN
- **Live**: https://user-app-delta-pearl.vercel.app

### Backend (`day5/`)
- **Technology**: Spring Boot 3.3, Java 21, PostgreSQL
- **Build**: `mvn clean install`
- **Deployment**: Render
- **Live**: https://day4-backend-lhwf.onrender.com
- **Health**: https://day4-backend-lhwf.onrender.com/api/health

## ✨ Key Features

### Security
- JWT authentication with refresh tokens
- Two-factor authentication (2FA)
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- Comprehensive audit logging
- Security audit: **8/8 controllers pass** ✅

### Performance
- **300+ concurrent users** verified
- **1.43ms** average response time
- **6-day load testing** (Days 91-96)
- Connection pooling optimized
- Zero-downtime deployment ready

### Reliability
- Circuit breaker protection
- Automatic retry logic
- Graceful shutdown (30 seconds)
- Health check endpoints
- Sentry error tracking
- **100% uptime** in production

### Developer Experience
- Clear code structure
- Comprehensive documentation
- Easy local setup
- Well-organized tests
- Detailed contributing guide

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React 19 + Vite)             │
│  https://user-app-delta-pearl.vercel.app│
└──────────────────┬──────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────┐
│  Backend (Spring Boot 3.3)              │
│  https://day4-backend-lhwf.onrender.com │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐  ┌────▼────┐  ┌─▼──────────┐
    │Sentry│  │PostgreSQL│  │Email/SMS   │
    │Track │  │   Neon   │  │Services    │
    └──────┘  └──────────┘  └────────────┘
```

## 🔐 Security Audit Results

**Day 56-60 Comprehensive Audit:**
- ✅ 8/8 Controllers Audited
- ✅ 3 Vulnerabilities Found and Fixed
- ✅ 0 Critical Issues Remaining
- ✅ OWASP Top 10 Compliance Verified

### Implemented Protections
- Input validation on all endpoints
- SQL injection prevention (JPA parameterized queries)
- XSS protection (React built-in)
- CSRF protection ready
- Rate limiting (100 req/min)
- Audit logging for compliance
- Password hashing (bcrypt strength 12)
- Secure session management

## 📈 Performance Metrics

Verified through **6-day load testing** (Days 91-96):

| Test | Result | Status |
|------|--------|--------|
| **Baseline (50 users)** | 100% success | ✅ PASS |
| **Stress (300 users)** | 100% success | ✅ PASS |
| **DB Connection (150 users)** | 100% success | ✅ PASS |
| **Graceful Shutdown** | 30s timeout works | ✅ PASS |
| **Health Check (200 users)** | 0% failures | ✅ PASS |
| **Circuit Breaker** | 98.65% success | ✅ PASS |

**Metrics:**
- Avg Response: 1.43ms
- p(95) Response: 2.33ms
- Max Response: 136.69ms
- Throughput: 131.54 req/s

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 19.2.4 |
| Frontend Build | Vite | 5.0+ |
| Backend | Spring Boot | 3.3.13 |
| Language | Java | 21 |
| Database | PostgreSQL | 16 |
| Database Host | Neon | Serverless |
| Frontend Hosting | Vercel | CDN |
| Backend Hosting | Render | Cloud |
| Error Tracking | Sentry | Real-time |
| Resilience | Resilience4j | 2.1.0 |

## 📖 Documentation

### Frontend (`day4/`)
- [Frontend README](./day4/README.md) - React setup and development
- [Frontend Contributing](./day4/CONTRIBUTING.md) - Code style and workflow

### Backend (`day5/`)
- [Backend README](./day5/README.md) - Spring Boot setup and configuration
- [Backend Contributing](./day5/CONTRIBUTING.md) - Java code style and guidelines
- [Security Policy](./SECURITY.md) - Vulnerability disclosure

### Project Documentation
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community guidelines
- [Security Policy](./SECURITY.md) - Security procedures
- [Roadmap](./ROADMAP.md) - Future features

## 🤝 Contributing

We welcome contributions! Please see:

1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
2. [day4/CONTRIBUTING.md](./day4/CONTRIBUTING.md) - Frontend contributions
3. [day5/CONTRIBUTING.md](./day5/CONTRIBUTING.md) - Backend contributions

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Create a Pull Request

## 🔒 Security

Found a security vulnerability? **Please do NOT open a public issue.**

Instead, email **security@example.com** with:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Your contact information

See [SECURITY.md](./SECURITY.md) for full disclosure policy.

## 📜 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 📊 Project Statistics

- **100 Days Development** - Complete journey documented
- **74 Java Classes** - Backend components
- **300+ Concurrent Users** - Load tested and verified
- **1.43ms Response Time** - Average performance
- **8/8 Security Audit** - Controllers audited
- **0 Critical Issues** - Security verified
- **100% Uptime** - Production proven

## 🎯 What's Next?

### Short-term (Next Month)
- Advanced analytics dashboard
- Data export functionality
- API improvements
- Performance monitoring

### Medium-term (Next Quarter)
- Multi-tenant support
- Mobile app consideration
- Enhanced reporting
- Webhook integrations

### Long-term (Next Year)
- GraphQL API
- Machine learning integration
- Advanced compliance features
- Global deployment

See [ROADMAP.md](./ROADMAP.md) for detailed plans.

## 📞 Support

### Getting Help
- **Documentation**: Check relevant README.md files
- **Issues**: Create a GitHub Issue
- **Discussions**: Start a GitHub Discussion
- **Security**: See [SECURITY.md](./SECURITY.md)

### Live Status
- **Frontend**: https://user-app-delta-pearl.vercel.app
- **Backend**: https://day4-backend-lhwf.onrender.com
- **Health Check**: https://day4-backend-lhwf.onrender.com/api/health

## 🙌 Acknowledgments

Built with modern, production-grade technologies:
- Spring Boot and Spring Security teams
- React and Vite communities
- Neon PostgreSQL platform
- Render deployment platform
- Sentry error tracking
- Vercel CDN

---

**Built over 100 days of intensive development**  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: July 11, 2026
