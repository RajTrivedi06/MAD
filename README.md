# MAD (Modern Academic Dashboard)

A modern, AI-powered academic dashboard built with Next.js, designed to help students discover courses, find research opportunities, and manage their academic journey with intelligent recommendations.

## 🎯 Project Overview

MAD is a comprehensive academic platform that combines modern UI/UX design with AI-powered features to enhance the student experience. The platform features a sophisticated red, black, and white color scheme with deepened neutrals and accent colors for optimal visual hierarchy and accessibility.

### Key Features

- **AI-Powered Course Search**: Intelligent course discovery with personalized recommendations
- **Research Opportunity Matching**: Find and apply for research assistant positions
- **Modern Dashboard**: Real-time academic overview with statistics and quick actions
- **User Authentication**: Secure login system with Supabase integration
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Sophisticated dark interface with red accent colors

## 🚀 Current Progress

### ✅ Completed Features

- **Authentication System**

  - User registration and login with Supabase
  - Protected routes and session management
  - User profile management

- **Navigation & Layout**

  - Modern navigation with responsive design
  - Breadcrumb navigation and user menu
  - Mobile-friendly navigation drawer

- **Dashboard Overview**

  - Academic statistics display
  - Quick action buttons
  - Recent activity feed
  - Progress tracking

- **Course Search System**

  - AI-powered search interface
  - Course filtering and categorization
  - Course details and enrollment information
  - Intelligent suggestions

- **Research Matching**

  - Research opportunity discovery
  - Position filtering and search
  - Application tracking
  - Professor and department information

- **UI/UX Design**
  - Red, black, and white color scheme
  - Deepened neutrals for better contrast
  - Accent colors for visual hierarchy
  - Modern glassmorphism effects
  - Responsive design patterns

### 🚧 In Progress

- **Enhanced AI Features**

  - More sophisticated course recommendations
  - Personalized learning paths
  - Academic goal tracking

- **Additional Features**
  - Calendar integration
  - Assignment tracking
  - Grade management
  - Peer collaboration tools

## 🛠 Tech Stack

### Frontend

- **Next.js 15.4.1** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and development experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Motion** - Animation library

### Backend & Services

- **Supabase** - Backend-as-a-Service
  - Authentication
  - Database
  - Real-time subscriptions

### Development Tools

- **Turbopack** - Fast bundler for development
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (v2.20.0 or higher)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mad.git
cd mad
```

### 2. Navigate to Frontend Directory

```bash
cd mh-frontend
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Environment Setup

Create a `.env.local` file in the `mh-frontend` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Additional environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🏗 Project Structure

```
mh-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── search/            # Course search page
│   │   ├── research/          # Research opportunities page
│   │   ├── profile/           # User profile page
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components
│   │   ├── profile/           # Profile components
│   │   ├── research/          # Research components
│   │   ├── search/            # Search components
│   │   └── ui/                # Reusable UI components
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   └── lib/                   # Utility libraries
│       ├── supabase/          # Supabase client configuration
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.mjs         # PostCSS configuration
└── package.json               # Project dependencies
```

## 🎨 Design System

### Color Palette

**Primary Colors:**

- Red: `#dc2626` (Primary accent)
- Black: `#000000` (Background)
- White: `#ffffff` (Text)

**Deepened Neutrals:**

- Neutral White: `#FFF9F9`
- Neutral Off-White: `#F7F7F7`
- Neutral Charcoal: `#222222`
- Neutral Slate: `#333842`
- Neutral Cool Grey: `#80838A`

**Accent Colors:**

- Muted Teal: `#009CA6`
- Steel Blue: `#4B9CD3`
- Rich Gold: `#D4AF37`
- Warm Beige: `#F2E9DB`

### Typography

- **Primary Font**: System fonts (San Francisco, Segoe UI, etc.)
- **Monospace Font**: System monospace fonts
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Package Management
npm install          # Install dependencies
npm update           # Update dependencies
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test
npm run test:watch
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

Fork the project to your GitHub account.

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Your Changes

- Follow the existing code style and conventions
- Add TypeScript types where appropriate
- Update documentation if needed
- Test your changes thoroughly

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
# or
git commit -m "fix: resolve bug description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with a detailed description of your changes.

### 6. Code Review

Your pull request will be reviewed by maintainers. Address any feedback and make necessary changes.

## 📝 Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🐛 Known Issues

- Tailwind CSS v4 is in alpha/beta, some features may be unstable
- Some animations may not work in older browsers
- Mobile navigation needs optimization for very small screens

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Frontend Developer**: [Your Name]
- **UI/UX Designer**: [Your Name]

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/mad/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend services
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the beautiful icons

---

**Made with ❤️ by the MAD Development Team**
