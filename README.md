# Ram Cycle Mart - Complete Sewing Machine Shop Management Solution

✨ **Complete Sewing Machine Shop Management Solution**

Streamline your sewing machine sales and service operations with our all-in-one management system designed to deliver an exceptional customer experience.

## 🚀 Features

### 👥 Customer Management
Maintain detailed customer records, purchase history, and service interactions to provide personalized support and build long-lasting trust.

### 🛠 Sewing Machine Service Tracking
Track repairs, routine maintenance, and warranty details efficiently to ensure your customers enjoy a smooth and reliable sewing experience.

### 💳 Billing & Invoicing
Generate accurate invoices, manage warranties, and track payments seamlessly with professional documentation.

### 🎯 Smart Inventory Management
Easily manage stock of new sewing machines, spare parts, and accessories to avoid shortages and fulfill customer needs on time.

### ⭐ Enhanced Customer Experience
From purchase to after-sales service, we ensure every interaction is simple, transparent, and delightful for your customers.

## 🔧 Additional Features

### Technical Features
- **Real-time Updates**: Live data synchronization across all modules
- **Search & Filtering**: Universal search capabilities across customers, inventory, and work orders
- **Payment Management**: Advanced payment tracking with due amounts and payment status updates
- **PDF Generation**: Professional bill and invoice generation with company branding
- **Dark/Light Themes**: Complete theme system with user preference storage
- **Gujarati Language Support**: Full localization with transliteration support

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **Radix UI** primitives with shadcn/ui design system
- **Tailwind CSS** with CSS variables for theming
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod schema validation

### Backend
- **Node.js** with Express.js framework
- **TypeScript** with ES modules
- **Passport.js** with local strategy and session-based auth
- **PostgreSQL** session storage using connect-pg-simple
- **Drizzle ORM** with type-safe queries

### Database
- **PostgreSQL** with Neon serverless hosting
- **Drizzle Kit** for migrations
- **Connection pooling** via @neondatabase/serverless

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ram-cycle-mart.git
   cd ram-cycle-mart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🚀 Deployment

This project is optimized for deployment on **Replit** with automatic environment setup and one-click deployment.

### Replit Deployment
1. Import the repository to Replit
2. Set up your `DATABASE_URL` environment variable
3. Run `npm run dev` to start the application

### Manual Deployment
1. Set up a PostgreSQL database
2. Configure environment variables
3. Run `npm run build` (if build script exists)
4. Deploy to your preferred hosting platform

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utility functions
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database abstraction layer
│   └── db.ts               # Database configuration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and types
└── README.md
```

## 🔐 Authentication & Authorization

- **Role-based access control** with Owner, Manager, Receptionist, and Technician roles
- **Session-based authentication** with secure cookie storage
- **Password hashing** using Node.js crypto module with scrypt
- **Protected routes** with frontend route protection

## 📊 Database Schema

### Core Models
- **Users**: Role-based access (owner, manager, receptionist, technician)
- **Customers**: Complete contact information and service history
- **Cycles**: Equipment tracking linked to customers
- **Work Orders**: Service requests with status tracking
- **Inventory Items**: Parts and supplies management
- **Advanced Bills**: Custom billing with detailed PDF receipts

## 🌐 Language Support

- **English/Gujarati** language switcher
- **Gujarati transliteration** for customer names and addresses
- **Gujarati numerals** and currency formatting
- **Persistent language preference** storage

## 📝 API Documentation

The application provides RESTful API endpoints for:
- Customer management (`/api/customers`)
- Work order management (`/api/work-orders`)
- Inventory management (`/api/inventory`)
- User management (`/api/users`)
- Billing and invoicing (`/api/advanced-bills`)
- Reports and analytics (`/api/dashboard`)

## 🧪 Development

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Development Commands
```bash
npm run dev          # Start development server
npm run db:push      # Push schema changes to database
npm run db:studio    # Open database studio (if available)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏪 About Ram Cycle Mart

Ram Cycle Mart is a trusted sewing machine sales and service center offering quality machines from top brands including Singer, Brother, and Janome. This management system helps streamline operations and improve customer service.

## 📞 Support

For support and questions, please contact:
- Email: info@ramcyclemart.com
- Phone: +91-9876543210
- Address: 123 Main Street, Commercial Complex, Ahmedabad, Gujarat 380001

---

Built with ❤️ by the Ram Cycle Mart team