import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/useTranslation';
import { useVerifyOtpMutation } from '@/store/api/authApi';

export default function VerifyOTP() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);

  // Redux mutation for OTP verification
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  useEffect(() => {
    if (router.query.email) {
      setEmail(router.query.email);
    }
  }, [router.query.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await verifyOtp({ email, otp }).unwrap();

      if (response.success) {
        setVerified(true);
        toast.success(t('verifyOtp.verified'), { duration: 4000 });
        // Redirect to login after a short delay so user can read the message
        setTimeout(() => {
          router.push('/login');
        }, 3500);
      } else {
        toast.error(response.error || t('verifyOtp.verificationFailed'));
      }
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.message ||
        t('verifyOtp.verificationFailed');
      toast.error(message, { duration: 5000 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow rounded-xl p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">{t('verifyOtp.title')}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('verifyOtp.subtitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('verifyOtp.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('verifyOtp.otp')}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full tracking-[0.5rem] text-center text-xl px-3 py-2 border border-gray-300 rounded-md"
                placeholder="______"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || verified}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {t('verifyOtp.verifying')}
              </>
            ) : verified ? (
              <>
                <span className="text-green-300">✓</span>
                {t('verifyOtp.verified')}
              </>
            ) : (
              t('verifyOtp.verifyButton')
            )}
          </button>
          {/* On success we auto-redirect; extra button is no longer needed */}
        </form>
      </div>
    </div>
  );
}


