const bcrypt = require('bcryptjs');
const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const LoginHistory = require('../../../models/LoginHistory');
const RefreshToken = require('../../../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, generateRefreshTokenString, getRefreshTokenExpiry, handleApiError } = require('../../../lib/utils');
const applyCors = require('../../../lib/cors');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email with the OTP sent to you.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact admin.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Generate access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Generate refresh token (JWT)
    const refreshTokenJWT = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Generate refresh token string for database storage
    const refreshTokenString = generateRefreshTokenString();

    // Get IP address - handle Vercel and other proxies
    let ipAddress = 'Unknown';
    
    // Vercel specific headers
    if (req.headers['x-vercel-forwarded-for']) {
      ipAddress = req.headers['x-vercel-forwarded-for'].split(',')[0].trim();
    } else if (req.headers['x-forwarded-for']) {
      // Standard proxy header (can contain multiple IPs)
      ipAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
    } else if (req.headers['x-real-ip']) {
      ipAddress = req.headers['x-real-ip'];
    } else if (req.headers['cf-connecting-ip']) {
      // Cloudflare
      ipAddress = req.headers['cf-connecting-ip'];
    } else if (req.socket?.remoteAddress) {
      ipAddress = req.socket.remoteAddress;
    } else if (req.connection?.remoteAddress) {
      ipAddress = req.connection.remoteAddress;
    }
    
    // Normalize localhost IPs for better readability
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1 (Localhost)';
    } else if (ipAddress === '127.0.0.1') {
      ipAddress = '127.0.0.1 (Localhost)';
    } else if (ipAddress && ipAddress.startsWith('::ffff:')) {
      // Convert IPv4-mapped IPv6 to IPv4
      ipAddress = ipAddress.replace('::ffff:', '');
    }
    
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Save refresh token to database
    const refreshTokenExpiry = getRefreshTokenExpiry();
    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenString,
      expiresAt: refreshTokenExpiry,
      ipAddress,
      userAgent,
    });

    // Record login history (don't await to avoid blocking response)
    LoginHistory.create({
      userId: user._id,
      email: user.email,
      ipAddress,
      userAgent,
      loginAt: new Date(),
    }).catch(err => {
      console.error('Failed to record login history:', err);
      // Don't fail login if history recording fails
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          kycStatus: user.kycStatus,
          profilePic: user.profilePic,
          adminApprovalStatus: user.adminApprovalStatus,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
        },
        token: accessToken,
        refreshToken: refreshTokenString,
      },
      message:
        user.adminApprovalStatus === 'approved'
          ? 'Login successful'
          : 'Login successful. Waiting for admin approval.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Login failed');
  }
}

