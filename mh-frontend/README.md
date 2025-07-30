# MH Frontend

A modern web application built with Next.js, Tailwind CSS, and Tanstack Router, featuring AI-powered course search and research assistant capabilities.

## 🚀 Features

- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Advanced Routing**: Tanstack Router for type-safe client-side routing
- **AI-Powered Course Search**: Intelligent search functionality with filters and categories
- **Research Assistant**: Document upload and AI analysis capabilities
- **Authentication**: Secure login and registration system
- **Responsive Design**: Mobile-first design with beautiful UI/UX
- **Type Safety**: Full TypeScript support throughout the application

## 📋 Pages

1. **Landing Page** (`/`) - Welcome page with features overview and call-to-action
2. **Course Search AI** (`/course-search`) - AI-powered course search with filters
3. **RA Feature** (`/ra-feature`) - Research assistant with document analysis
4. **Login** (`/login`) - User authentication
5. **Register** (`/register`) - User registration

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Tanstack Router
- **Icons**: Heroicons (via SVG)
- **Fonts**: Geist Sans and Geist Mono

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd mh-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (handled by router)
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ClientRouter.tsx   # Tanstack Router client wrapper
│   └── RootLayout.tsx     # Main layout with navigation
├── pages/                 # Page components
│   ├── LandingPage.tsx    # Landing page
│   ├── CourseSearchAI.tsx # Course search functionality
│   ├── RAFeature.tsx      # Research assistant
│   └── auth/              # Authentication pages
│       ├── LoginPage.tsx  # Login form
│       └── RegisterPage.tsx # Registration form
└── router.tsx             # Tanstack Router configuration
```

## 🎨 Features in Detail

### Course Search AI

- Advanced search with multiple filters (category, level)
- Real-time search results
- Course ratings and enrollment information
- Responsive course cards with detailed information

### Research Assistant

- Document upload (PDF, DOCX, TXT)
- AI-powered document analysis
- Summary generation and key points extraction
- Sentiment analysis with confidence scores
- Document management and search

### Authentication

- Form validation with real-time error feedback
- Password strength requirements
- Social login options (Google, GitHub)
- Remember me functionality
- Responsive design for all devices

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎯 Key Features

### Navigation

- Responsive navigation bar with mobile menu
- Active route highlighting
- Smooth transitions and hover effects

### UI/UX

- Modern, clean design with Tailwind CSS
- Consistent color scheme (Indigo primary)
- Loading states and animations
- Error handling and user feedback
- Accessibility considerations

### Performance

- Optimized bundle size
- Lazy loading where appropriate
- Efficient state management
- Type-safe routing

## 🔮 Future Enhancements

- [ ] Backend API integration
- [ ] Real AI/ML integration for course search
- [ ] User dashboard and profile management
- [ ] Course enrollment system
- [ ] Advanced document analysis features
- [ ] Real-time notifications
- [ ] Dark mode support
- [ ] Internationalization (i18n)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
