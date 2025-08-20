# Mandal Book - Group Savings & Ledger Management System

A modern, full-stack web application for managing group savings, contributions, and financial tracking with real-time updates and comprehensive admin controls.

## 🚀 Features

### Core Functionality
- **Group Savings Management**: Track monthly contributions and group funds
- **User Management**: Role-based access control (Admin/Member)
- **Contribution System**: Monthly installment payments with proof upload
- **Real-time Updates**: Live notifications and status updates
- **KYC Integration**: Complete user verification system
- **Audit Logging**: Comprehensive activity tracking

### Admin Features
- **Dashboard Analytics**: Visual charts and statistics
- **User Management**: Approve, suspend, and manage user roles
- **Contribution Verification**: Review and approve payments
- **Audit Logs**: Monitor all system activities
- **Notifications Center**: Manage alerts and notifications
- **Group Setup**: Configure monthly contribution amounts

### User Features
- **Profile Management**: Update personal and KYC information
- **Contribution History**: View payment history and status
- **Real-time Status**: Live updates on contribution approval
- **Document Upload**: Secure proof of payment storage

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: Latest React features and hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **Redux Toolkit**: State management
- **Socket.IO Client**: Real-time communication

### Backend
- **Node.js**: Server runtime
- **Next.js API Routes**: Backend API endpoints
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **NextAuth.js**: Authentication system
- **Socket.IO**: Real-time server communication

### External Services
- **Cloudinary**: Image upload and storage
- **Resend**: Email notifications
- **Vercel**: Deployment platform

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Cloudinary account
- Resend account (for email notifications)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mandal-book
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Authentication
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   
   # Optional: Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Database Setup**
   ```bash
   # Seed initial data
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Start Custom Server** (for Socket.IO)
   ```bash
   npm run start
   ```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard
│   ├── profile/           # User profile
│   ├── kyc/              # KYC management
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
├── models/               # Mongoose models
├── store/                # Redux store configuration
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## 🔧 Configuration

### Database Models
- **User**: User accounts and profiles
- **Contribution**: Payment records and status
- **AuditLog**: System activity tracking
- **Group**: Group configuration and settings

### API Endpoints
- `/api/auth/*`: Authentication routes
- `/api/contributions/*`: Contribution management
- `/api/admin/*`: Admin-only operations
- `/api/users/*`: User management
- `/api/seed-*`: Database seeding

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Custom Server Deployment
1. Build the application: `npm run build`
2. Start production server: `npm run start`
3. Use PM2 or similar for process management

## 🔒 Security Features

- **Role-based Access Control**: Admin/Member permissions
- **Input Validation**: Server-side validation for all inputs
- **Audit Logging**: Complete activity tracking
- **Secure File Upload**: Cloudinary integration with validation
- **JWT Authentication**: Secure session management
- **Rate Limiting**: API request throttling

## 📊 Analytics & Monitoring

- **Real-time Dashboard**: Live statistics and charts
- **User Activity Tracking**: Login and action monitoring
- **Contribution Analytics**: Payment trends and patterns
- **System Health Monitoring**: Performance and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in `/docs` folder

## 🔄 Updates & Maintenance

- Regular security updates
- Performance optimizations
- Feature enhancements
- Bug fixes and improvements

---

**Built with ❤️ for efficient group savings management**
