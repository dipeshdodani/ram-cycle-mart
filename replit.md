# Replit.md

## Overview

Ram Cycle Mart is a comprehensive sewing machine service and repair shop management system built with a modern full-stack architecture. The application provides complete business management functionality including customer management, sewing machine repair tracking, inventory control, billing/invoicing with warranty tracking, advanced billing with PDF generation, and reporting capabilities. It's designed specifically for sewing machine repair shops to streamline their operations and improve customer service.

## Recent Changes

**Latest Updates (August 2025):**
- **PDF Generation Fixed**: Resolved TypeScript errors in jsPDF autoTable implementation with fallback support
- **Users Management**: Converted to Excel-style table format with proper authentication and delete functionality
- **Enhanced Error Handling**: Better foreign key constraint error messages and user-friendly feedback
- **Sales Reports & Payment Management**: Complete billing system with payment tracking, edit functionality, and mark-as-paid options
- **User-Friendly Error Messages**: Replaced technical error codes with clear, helpful messages for better user experience
- **Bill Editing System**: Advanced payment management with partial payments, due amount calculations, and real-time updates
- **GitHub Ready**: Added comprehensive README.md, LICENSE, and proper .gitignore for version control
- **Excel-Style Compact Views**: Efficient table layouts across all pages with comprehensive search and filtering

## User Preferences

Preferred communication style: Simple, everyday language.

**Language Support**: Full Gujarati language integration with:
- Language switcher in navbar for English/Gujarati toggle
- Gujarati text transliteration for customer names and addresses
- Gujarati numerals and currency formatting
- Gujarati fonts (Noto Sans Gujarati) for proper script rendering
- Language preference persistence in localStorage

## System Features

### Core Business Operations
- **Customer Management**: Complete customer database with contact information and service history
- **Work Order System**: Service request tracking with status management and priority levels
- **Inventory Control**: Parts and supplies management with stock tracking and low-stock alerts
- **Technician Management**: Staff tracking with role-based access and workload monitoring
- **Advanced Billing**: Professional invoicing with GST/Non-GST options, partial payments, and warranty tracking
- **Sales Reports**: Comprehensive reporting with payment status tracking and Excel export functionality

### Technical Features
- **Real-time Updates**: Live data synchronization across all modules
- **Search & Filtering**: Universal search capabilities across customers, inventory, and work orders
- **Payment Management**: Advanced payment tracking with due amounts and payment status updates
- **PDF Generation**: Professional bill and invoice generation with company branding
- **Dark/Light Themes**: Complete theme system with user preference storage

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