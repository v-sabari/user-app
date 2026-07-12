# Day4 - Frontend Application

[![React 19](https://img.shields.io/badge/react-19.2.4-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-5.0+-purple?logo=vite)](https://vite.dev/)
[![Vercel](https://img.shields.io/badge/deployed-vercel-black)](https://user-app-delta-pearl.vercel.app)
[![Live](https://img.shields.io/badge/status-live-green)](https://user-app-delta-pearl.vercel.app)

React 19 + Vite frontend for the User Management platform. Deployed on Vercel CDN with optimized caching and edge network delivery.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in browser
```

### Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

## 📁 Project Structure

```
day4/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── utils/          # Utility functions
│   ├── assets/         # Images, fonts, etc
│   ├── App.jsx         # Root component
│   └── main.jsx        # Entry point
├── public/             # Static files
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── eslint.config.js    # ESLint configuration
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

## ⚙️ Configuration

### Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=User Management
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### For Production (Vercel)

Set in Vercel dashboard under Settings → Environment Variables:

```
VITE_API_URL=https://day4-backend-lhwf.onrender.com
VITE_SENTRY_DSN=your_sentry_dsn_here
```

## 🏗️ Architecture

### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main
│       ├── Dashboard
│       ├── UserManagement
│       ├── Analytics
│       └── Settings
└── Auth
    ├── Login
    ├── Register
    └── ForgotPassword
```

### State Management
- React Context API for global state
- localStorage for user preferences
- React hooks for component state

### API Integration
- Fetch API for HTTP requests
- JWT token handling
- Error handling and logging
- Request/response interceptors

## 🎨 Features

### User Interface
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ Accessibility compliant
- ✅ Smooth animations and transitions
- ✅ Toast notifications
- ✅ Loading states

### Authentication
- ✅ Login/Register flows
- ✅ JWT token management
- ✅ 2FA support
- ✅ Password reset
- ✅ Session management

### User Management
- ✅ User listing with pagination
- ✅ User profile management
- ✅ Bulk operations
- ✅ Search and filtering
- ✅ Export functionality

### Analytics
- ✅ Dashboard charts
- ✅ User statistics
- ✅ Activity tracking
- ✅ Performance metrics

## 📊 Performance

### Optimization Techniques
- ✅ Code splitting via Vite
- ✅ Lazy loading of components
- ✅ Image optimization
- ✅ CSS minification
- ✅ Tree shaking
- ✅ Route-based code splitting

### Caching Strategy (Vercel)
```
Assets (/assets/*):    1-year cache (immutable)
HTML (/*):             1-hour cache (revalidate)
API calls:             No caching (dynamic)
```

### Performance Metrics
- **First Paint**: < 100ms
- **Time to Interactive**: < 500ms
- **Lighthouse Score**: 90+

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Test Structure
```
src/
├── components/
│   └── Button.test.jsx
├── hooks/
│   └── useAuth.test.js
├── services/
│   └── api.test.js
└── __tests__/
    └── integration.test.js
```

## 🚀 Deployment

### Vercel (Current)

The application is automatically deployed to Vercel on every push to `main`:

1. **Setup**: Connect GitHub repository to Vercel
2. **Environment**: Configure VITE_API_URL in Vercel dashboard
3. **Deploy**: Push to main branch
4. **View**: https://user-app-delta-pearl.vercel.app

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel CLI
npm i -g vercel
vercel
```

## 🔗 Connecting to Backend

### Backend URL Configuration

Update API endpoint in environment variables:

```env
# Local development
VITE_API_URL=http://localhost:8080

# Production
VITE_API_URL=https://day4-backend-lhwf.onrender.com
```

### API Integration Example

```javascript
// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
  async getUsers() {
    const response = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return response.json();
  }
};
```

## 📦 Dependencies

### Core
- react@19.2.4
- react-dom@19.2.4
- react-router-dom@7.14.0

### Build Tools
- vite@5.0+
- @vitejs/plugin-react
- babel-plugin-react-compiler

### Development
- eslint
- @babel/core
- typescript (optional)

## 🛠️ Development Workflow

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Meaningful component names
- Clear prop documentation

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/component-name

# Make changes and test
npm run dev
npm test

# Commit with clear message
git commit -m "Add new component for feature X"

# Push and create PR
git push origin feature/component-name
```

### Debugging

```javascript
// Use React DevTools browser extension
// Enable in browser: Inspect → Components

// Console logging
console.log('Data:', data);

// React profiler
<Profiler id="component" onRender={callback}>
  <Component />
</Profiler>
```

## 🔒 Security

### Best Practices
- ✅ Never commit .env files
- ✅ Sanitize user input
- ✅ Use HTTPS for API calls
- ✅ Secure token storage (httpOnly cookies when possible)
- ✅ Content Security Policy headers
- ✅ CORS validation

### Environment Variables
Never commit sensitive data:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

## 🐛 Troubleshooting

### Common Issues

**Port 5173 already in use**
```bash
# Use different port
npm run dev -- --port 3000
```

**Dependencies issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Vite cache issues**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**API not responding**
- Verify backend is running: `http://localhost:8080/api/health`
- Check VITE_API_URL in .env.local
- Check CORS configuration in backend

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [React Router](https://reactrouter.com)
- [Vercel Deployment](https://vercel.com/docs)

### Related Projects
- Backend: [day5/README.md](../day5/README.md)
- Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Security: [SECURITY.md](../SECURITY.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Frontend-Specific Guidelines
1. Use functional components and hooks
2. Write JSDoc comments for components
3. Keep components focused and testable
4. Use meaningful prop names
5. Test component interactions

## 📞 Support

- **Issues**: Create GitHub issue
- **Questions**: Start GitHub discussion
- **Live App**: https://user-app-delta-pearl.vercel.app
- **Backend API**: https://day4-backend-lhwf.onrender.com

## 📄 License

MIT License - See [LICENSE](../LICENSE)

---

**Live Application**: https://user-app-delta-pearl.vercel.app  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: July 11, 2026
