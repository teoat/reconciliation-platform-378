# Reconciliation Platform - Frontend

A modern, responsive React frontend for the Reconciliation Platform built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

- **Modern React Architecture**: Built with React 18, TypeScript, and modern hooks
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Collaboration**: WebSocket integration for live updates
- **Advanced Analytics**: Comprehensive dashboard with charts and metrics
- **File Processing**: Support for CSV, JSON, and Excel file uploads
- **Reconciliation Engine**: Automated and manual reconciliation workflows
- **Security**: JWT authentication, role-based access control, and security headers
- **Performance**: Lazy loading, code splitting, and performance monitoring
- **Testing**: Comprehensive test suite with Vitest and React Testing Library
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation support

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Reconciliation/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:1000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── forms/          # Form components and validation
│   ├── layouts/        # Layout components
│   └── pages/          # Page components
├── hooks/              # Custom React hooks
├── services/           # API client and external services
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/             # Configuration files
└── test/               # Test utilities and setup
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and hook testing
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end workflow testing
- **Accessibility Tests**: WCAG compliance testing

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t reconciliation-frontend .

# Run container
docker run -p 80:80 reconciliation-frontend
```

### Docker Compose
```bash
# Start full stack
docker-compose up -d
```

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy using script
./deploy.sh production
```

## 📊 Performance

### Core Web Vitals
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

### Optimization Features
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component and image lazy loading
- **Caching**: Intelligent API and asset caching
- **Compression**: Gzip compression for assets
- **CDN**: Content delivery network integration

## 🔒 Security

### Security Features
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **CSP**: Content Security Policy headers
- **HTTPS**: Secure communication
- **Input Validation**: Client-side validation
- **XSS Protection**: Cross-site scripting prevention

### Security Headers
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📱 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| IE | 11 | ⚠️ Limited |

## 🎨 UI/UX

### Design System
- **Colors**: Consistent color palette
- **Typography**: Scalable font system
- **Spacing**: 8px grid system
- **Components**: Reusable component library
- **Icons**: Lucide React icon set

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Accessibility
- **WCAG 2.1 AA**: Compliant accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: 4.5:1 minimum ratio
- **Focus Management**: Visible focus indicators

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws

# App Configuration
VITE_APP_NAME=Reconciliation Platform
VITE_APP_VERSION=1.0.0

# Development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Feature Flags
```typescript
// Enable/disable features
FEATURES: {
  REAL_TIME_COLLABORATION: true,
  ADVANCED_ANALYTICS: true,
  FILE_UPLOAD: true,
  WEBHOOK_INTEGRATION: true,
}
```

## 📈 Monitoring

### Performance Monitoring
- **Core Web Vitals**: Automatic tracking
- **API Performance**: Response time monitoring
- **Error Tracking**: Error rate monitoring
- **User Analytics**: Usage pattern analysis

### Health Checks
- **API Health**: Backend connectivity
- **WebSocket Health**: Real-time connection status
- **Performance Health**: Response time thresholds

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### API Connection Issues
```bash
# Check backend is running
curl http://localhost:8080/api/health

# Verify environment variables
echo $VITE_API_URL
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for memory leaks
npm run dev -- --inspect
```

### Debug Mode
```bash
# Enable debug logging
VITE_DEBUG=true npm run dev
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Write** tests for new features
5. **Run** the test suite
6. **Submit** a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

### Pull Request Process
1. **Tests**: All tests must pass
2. **Coverage**: Maintain test coverage > 80%
3. **Documentation**: Update docs for new features
4. **Review**: Code review required
5. **Merge**: Squash and merge

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)
- [Testing Guide](./docs/testing.md)
- [Deployment Guide](./docs/deployment.md)
- [User Testing Guide](./USER_TESTING.md)

## 🆘 Support

### Getting Help
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check the docs folder
- **Community**: Join our Discord server

### Reporting Bugs
1. **Check** existing issues
2. **Create** new issue with template
3. **Provide** reproduction steps
4. **Include** browser and OS info
5. **Attach** screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team**: For the amazing framework
- **Vite Team**: For the fast build tool
- **Tailwind CSS**: For the utility-first CSS framework
- **Lucide**: For the beautiful icons
- **Community**: For contributions and feedback

---

**Built with ❤️ by the Reconciliation Platform Team**

