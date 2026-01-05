import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetPaymentSettingsQuery } from '@/store/api/settingsApi';

export default function UPIPayment({ amount, type, referenceId, upiProvider = 'gpay', onSuccess, onError, buttonText = 'Pay Now' }) {
  const [loading, setLoading] = useState(false);
  const { data: settingsData } = useGetPaymentSettingsQuery();
  const upiId = settingsData?.data?.upiId;

  const handleUPIPayment = () => {
    // Validation
    const paymentAmount = parseFloat(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!type || !referenceId) {
      toast.error('Payment details are missing');
      return;
    }

    if (!upiId) {
      toast.error('UPI ID not configured. Please contact admin.');
      return;
    }

    setLoading(true);

    try {
      // Format amount (2 decimal places)
      const formattedAmount = paymentAmount.toFixed(2);
      const paymentNote = `Mandal ${type === 'contribution' ? 'Contribution' : 'Loan'} Payment`;
      
      // Create UPI payment link
      let upiLink = '';
      let fallbackLink = '';
      
      if (upiProvider.toLowerCase() === 'gpay') {
        // Google Pay - Try UPI protocol first (opens app on mobile)
        upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
        
        // Fallback: Google Pay web link
        fallbackLink = `https://pay.google.com/gp/v/save/${encodeURIComponent(upiId)}?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
      } else if (upiProvider.toLowerCase() === 'phonepe') {
        // PhonePe - Try app protocol first
        upiLink = `phonepe://pay?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
        
        // Fallback: Generic UPI protocol
        fallbackLink = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
      } else {
        // Generic UPI payment link
        upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
        fallbackLink = upiLink;
      }

      // Try to open UPI app
      // On mobile: This will open the app directly
      // On desktop: This might open a UPI handler or show an error
      try {
        // Create a temporary link and click it (better compatibility)
        const link = document.createElement('a');
        link.href = upiLink;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Fallback: If UPI protocol doesn't work, try web link after delay
        setTimeout(() => {
          // Check if we're on mobile
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (!isMobile && fallbackLink.startsWith('https://')) {
            window.open(fallbackLink, '_blank');
          }
        }, 500);
      } catch (e) {
        // If UPI protocol fails, try fallback
        if (fallbackLink.startsWith('https://')) {
          window.open(fallbackLink, '_blank');
        } else {
          window.location.href = fallbackLink;
        }
      }

      // Show instruction message
      toast.success(
        `Opening ${upiProvider === 'gpay' ? 'Google Pay' : 'PhonePe'}... Please complete the payment.`,
        { duration: 4000 }
      );

      setLoading(false);
      
      if (onSuccess) {
        onSuccess({ message: 'Payment app opened' });
      }
    } catch (error) {
      console.error('UPI payment error:', error);
      toast.error('Failed to open payment app. Please try again.');
      setLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      onClick={handleUPIPayment}
      disabled={loading || !upiId}
      className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Opening...
        </>
      ) : (
        <>
          {upiProvider === 'gpay' ? (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Pay with Google Pay
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              Pay with PhonePe
            </>
          )}
        </>
      )}
    </button>
  );
}

