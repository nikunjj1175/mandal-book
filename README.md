# 📘 Group Money Management System

A complete web-based platform for managing group contributions, savings, loan requests, and KYC verification with UPI payment slip processing and admin approval workflows.

## 🚀 Features

### 🔐 Authentication & User Management
- Secure JWT-based authentication
- Role-based access control (Admin/Member)
- Email OTP verification during registration
- Admin gatekeeping before granting feature access
- Profile management

### ✅ Admin Approval Workflow
- Registration → OTP email verification
- Verified users create approval requests automatically
- Admin approves/rejects requests with remarks
- Members gain access to every module only after approval

### 📋 KYC (Know Your Customer) System
- Complete profile information collection
- Document upload (Aadhaar, PAN, Bank Passbook)
- Admin approval/rejection workflow
- KYC status tracking (Pending/Under Review/Verified/Rejected)
- Email notifications for KYC status updates

### 💰 Monthly Contribution System
- Upload UPI payment slip screenshots
- **Automatic OCR extraction** of:
  - Transaction Reference ID
  - Amount
  - Date and Time
- Admin verification and approval
- Contribution history tracking
- Status management (Pending/Done/Rejected)

### 💳 Loan Management
- Loan request submission
- Admin approval with interest rate assignment
- Loan tracking and repayment management
- Email notifications

### 👥 Group Member Management
- View all group members
- KYC status visibility
- Contribution status (masked sensitive data)
- Profile information display

### 🔔 Notifications
- Real-time notifications for:
  - KYC status updates
  - Contribution approvals/rejections
  - Loan request updates
- Email notifications via Nodemailer

### 🎨 Dashboards
- Member dashboard with responsive contribution charts & history
- Admin dashboard with fund overview graph, pending approvals & workflow queues
- Real-time stats for total members, pending KYC, and fund inflow

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework
- **React** - UI library
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Next.js API Routes** - Serverless API
- **Node.js** - Runtime
- **Express.js** - (via Next.js)
- **JWT** - Authentication
- **Bcryptjs** - Password hashing

### Database
- **MongoDB** - NoSQL database
- **Mongoose** - ODM

### Services
- **Cloudinary** - Image storage and management
- **Tesseract.js** - OCR for UPI slip processing
- **Nodemailer** - Email notifications
- **Structured uploads**: every asset lives under `mandal/<user-id>/kyc/...` or `mandal/<user-id>/payments/...` folders for clean segregation

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Cloudinary account
- SMTP email account (Gmail recommended)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd mandal
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/group-money-management

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Nodemailer & OTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@groupmoney.com
OTP_EXPIRY_MINUTES=10

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start MongoDB** (if using local)
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

5. **Run the development server**
```bash
npm run dev
```

7. **Seed sample data (optional)**
```bash
npm run seed
```
This command wipes existing collections and inserts 10 demo records into each primary collection (users, contributions, loans, notifications) for quick previews. The script reads from `.env.local`, so ensure it’s configured before running.

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
mandal/
├── components/          # React components
│   ├── ErrorBoundary.js
│   └── Layout.js
├── context/            # React context
│   └── AuthContext.js
├── lib/                # Utility libraries
│   ├── api.js          # API client
│   ├── cloudinary.js   # Cloudinary integration
│   ├── email.js        # Email service
│   ├── mongodb.js      # Database connection
│   ├── ocr.js          # OCR processing
│   └── utils.js        # Helper functions
├── middleware/         # API middleware
│   └── auth.js         # Authentication middleware
├── models/             # MongoDB models
│   ├── User.js
│   ├── Contribution.js
│   ├── Loan.js
│   └── Notification.js
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── admin/      # Admin endpoints
│   │   ├── contribution/
│   │   ├── loan/
│   │   └── user/
│   ├── _app.js         # App wrapper
│   ├── index.js        # Home page
│   ├── login.js        # Login page
│   ├── register.js     # Registration page
│   ├── dashboard.js    # User dashboard
│   ├── kyc.js          # KYC submission
│   ├── contributions.js # Contributions page
│   ├── loans.js        # Loans page
│   ├── members.js      # Members page
│   └── admin.js        # Admin dashboard
├── styles/             # Global styles
│   └── globals.css
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (sends OTP)
- `POST /api/auth/login` - User login (enforces verification)
- `POST /api/auth/verify-otp` - Verify email OTP
- `GET /api/auth/me` - Get current user

### User
- `PUT /api/user/update-profile` - Update user profile
- `POST /api/user/upload-documents` - Upload KYC documents

### Contributions
- `POST /api/contribution/upload-slip` - Upload contribution slip
- `GET /api/contribution/my` - Get user contributions

### Loans
- `POST /api/loan/request` - Request loan

- `GET /api/admin/overview` - Dashboard metrics & monthly graph
- `GET /api/admin/users/pending` - Pending member approvals
- `POST /api/admin/users/approve` - Approve member access
- `POST /api/admin/users/reject` - Reject member access
- `GET /api/admin/kyc/pending` - Get pending KYC requests
- `POST /api/admin/kyc/approve` - Approve KYC
- `POST /api/admin/kyc/reject` - Reject KYC
- `GET /api/admin/contribution/pending` - Get pending contributions
- `POST /api/admin/contribution/approve` - Approve contribution
- `POST /api/admin/contribution/reject` - Reject contribution
- `POST /api/admin/loan/approve` - Approve loan
- `POST /api/admin/loan/reject` - Reject loan

### Other
- `GET /api/members` - Get all members
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark notification as read

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Sensitive data masking (Aadhaar/PAN numbers)
- File upload validation
- Error boundaries for error handling
- Input validation and sanitization

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop
- Tablet
- Mobile devices

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Heroku

## 📝 Usage Guide

### For Members

1. **Register**: Sign up and receive OTP on email
2. **Verify OTP**: Submit the code to confirm email ownership
3. **Wait for Approval**: Admin reviews & activates your account
4. **Complete KYC**: Upload Aadhaar, PAN, and bank proofs
5. **Upload Contributions**: Submit UPI slips each month (OCR auto-fills data)
6. **Request Loans**: Apply for loans and track interest/repayments
7. **Monitor Status**: Use dashboard charts & tables for history

### For Admin

1. **Login** with admin credentials
2. **Approve Members**: Review pending access requests coming from verified users
3. **Monitor Overview**: Use dashboard chart to track monthly funds & stats
4. **Review KYC**: Approve/reject KYC submissions
5. **Verify Contributions**: Review and approve contribution slips
6. **Manage Loans**: Approve/reject loan requests
7. **Send Notifications**: Members automatically receive emails/notices

## 🐛 Error Handling

- Global error boundary for React errors
- API error handling with proper status codes
- User-friendly error messages
- Console logging for debugging

## 🔮 Future Enhancements

- Auto EMI calculator
- Interest calculation charts
- Export reports (PDF/Excel)
- Multi-group support
- SMS notifications
- Mobile app
- Real-time chat
- Payment gateway integration

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email support@groupmoney.com or create an issue in the repository.

## 🙏 Acknowledgments

- Next.js team
- MongoDB
- Cloudinary
- Tesseract.js
- All open-source contributors

---

**Made with ❤️ for group money management**

