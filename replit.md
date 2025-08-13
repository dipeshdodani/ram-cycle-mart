# Replit.md

## Overview

Ram Cycle Mart is a comprehensive cycle service and repair shop management system built with a modern full-stack architecture. The application provides complete business management functionality including customer management, work order tracking, inventory control, billing/invoicing, advanced billing with PDF generation, and reporting capabilities. It's designed specifically for cycle repair shops to streamline their operations and improve customer service.

## Recent Changes

**January 2025 Updates:**
- **Rebranded to "Ram Cycle Mart"**: Changed from SewCraft Pro to Ram Cycle Mart with custom cycle wheel logo
- **Implemented Dark Theme**: Added complete dark/light theme system with theme toggle in navbar
- **Advanced Billing System**: Created comprehensive billing module with custom items, descriptions, and PDF generation
- **Enhanced UI Visibility**: Fixed button visibility issues with improved contrast in both light and dark modes
- **INR Currency Support**: Full conversion from USD to INR with Indian locale formatting and 18% GST
- **Gujarati Transliteration**: Maintained existing transliteration system for customer information
- **Web Hosting Package**: Complete export package for self-hosting with deployment guides
- **Desktop Application**: Electron-based desktop conversion for offline .exe file creation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod schema validation
- **Authentication**: Context-based auth provider with protected routes
- **Theme System**: Dark/light mode with persistent user preference storage
- **PDF Generation**: jsPDF integration for invoice and bill generation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt for hashing
- **API Design**: RESTful endpoints with consistent error handling
- **Request Logging**: Custom middleware for API request/response logging

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling via @neondatabase/serverless
- **Data Validation**: Zod schemas for runtime type checking
- **Relationships**: Proper foreign key relationships between entities

### Core Data Models
- **Users**: Role-based access (owner, manager, receptionist, technician)
- **Customers**: Complete contact information and service history with Gujarati transliteration
- **Cycles**: Equipment tracking linked to customers (renamed from Sewing Machines)
- **Work Orders**: Service requests with status tracking and priority levels
- **Inventory Items**: Parts and supplies management with stock tracking
- **Invoices**: Billing system with payment status tracking and PDF generation
- **Advanced Bills**: Custom billing with item descriptions and detailed PDF receipts

### Security Architecture
- **Authentication**: Session-based with secure cookie storage
- **Password Hashing**: Scrypt with salt for secure password storage
- **Session Management**: PostgreSQL session store with automatic cleanup
- **CSRF Protection**: Built into session middleware
- **Input Validation**: Server-side validation using Zod schemas
- **Protected Routes**: Frontend route protection with authentication checks

### Build & Deployment
- **Frontend Build**: Vite for fast development and optimized production builds
- **Backend Build**: esbuild for efficient server-side bundling
- **Development**: Hot module replacement with Vite dev server
- **Production**: Static file serving with Express in production mode
- **Environment**: Environment-based configuration for database connections

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment-based connection string configuration

### Development Tools
- **Replit Integration**: Custom Replit plugins for development environment
- **Error Handling**: Runtime error overlay for development debugging
- **Code Mapping**: Source map support for debugging

### UI Libraries
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide Icons**: Icon library for consistent iconography
- **Recharts**: Data visualization for reports and analytics
- **React Day Picker**: Date selection components
- **jsPDF**: PDF generation for invoices and bills
- **html2canvas**: Canvas-based screenshot functionality

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: CSS class name utilities
- **class-variance-authority**: Type-safe variant styling
- **nanoid**: Unique ID generation

### Development Dependencies
- **TypeScript**: Static type checking and IntelliSense
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing and autoprefixing
- **ESLint/Prettier**: Code formatting and linting (implicit)