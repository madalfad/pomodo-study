# Overview

pomodo.study is a free in-browser study and productivity application that provides a distraction-free focus environment. The application combines a Pomodoro timer, ambient sound mixer, to-do list, and real-time globe visualization showing active users worldwide. Built as a Progressive Web App (PWA), it offers both desktop and mobile experiences with customizable ambience settings using YouTube videos and sound controls.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with a custom dark theme as default, using CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible interfaces
- **State Management**: React's built-in useState and useContext, with custom hooks for localStorage persistence
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth component transitions and interactions
- **3D Graphics**: Three.js for the interactive globe visualization showing global user activity

## Backend Architecture
- **Server**: Express.js with TypeScript serving both API endpoints and static assets
- **Development**: Vite integration for hot module replacement and development middleware
- **Storage**: In-memory storage implementation with interface for future database integration
- **API Design**: RESTful endpoints with JSON responses and proper error handling

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions and migrations
- **Local Storage**: Custom useLocalStorage hook for persisting user preferences, timer settings, and to-do items
- **Session Management**: Prepared for database-backed sessions with connect-pg-simple integration

## Authentication and Authorization
- **User Schema**: Defined user table with username/password fields ready for implementation
- **Security**: Placeholder authentication system with user creation and lookup methods
- **Session Storage**: PostgreSQL session store configuration for production use

## External Dependencies

### Third-party Services
- **Neon Database**: PostgreSQL database hosting service (@neondatabase/serverless)
- **YouTube API**: Embedded video player for ambient sound mixing
- **Buy Me a Coffee**: Donation widget integration for creator support
- **Google Fonts**: Poppins and Work Sans font families for typography

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **TanStack Query**: Server state management and caching for API calls
- **ESBuild**: TypeScript compilation and bundling for production

### Audio System
- **Web Audio API**: Custom sound player implementation for notification sounds
- **YouTube Embed**: Integration for ambient background sounds with volume controls
- **Audio Assets**: MP3 files for timer notifications (begin, break start/end, task complete)

### PWA Features
- **Service Worker**: Configured for offline functionality and app installation
- **Manifest**: Web app manifest for native app-like experience
- **Icons**: Multiple favicon formats and app icons for different devices and platforms

### Browser APIs
- **LocalStorage**: Persistent user preferences and application state
- **Web Audio**: Audio context management for sound playback
- **Responsive Design**: Mobile-first approach with adaptive layouts

The application follows a component-based architecture with clear separation of concerns, making it maintainable and extensible for future features while providing a smooth user experience across devices.