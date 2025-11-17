export default function PendingApprovalMessage({ emailVerified, adminApprovalStatus }) {
  const messages = [];

  if (!emailVerified) {
    messages.push('Please verify your email using the OTP we sent.');
  }

  if (adminApprovalStatus !== 'approved') {
    messages.push('Your account is awaiting admin approval.');
  }

  return (
    <div className="bg-white shadow rounded-xl p-8 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
        <span className="text-yellow-600 text-3xl">⏳</span>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access on Hold</h2>
      <p className="text-gray-600 mb-4">
        {messages.join(' ')} You will get notified once the process is complete.
      </p>
    </div>
  );
}


