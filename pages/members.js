import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import { useGetMembersQuery } from '@/store/api/membersApi';

export default function Members() {
  const { user } = useAuth();
  const { openChat } = useChat();

  // Redux hooks
  const { data: membersData, isLoading: loading } = useGetMembersQuery(undefined, {
    skip: !user || (user.role !== 'admin' && user.adminApprovalStatus !== 'approved'),
  });

  const members = membersData?.data?.members || [];

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'under_review':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  if (!user) return null;

  if (user.role !== 'admin' && user.adminApprovalStatus !== 'approved') {
    return (
      <Layout>
        <div className="px-4 py-10">
          <PendingApprovalMessage
            emailVerified={user.emailVerified}
            adminApprovalStatus={user.adminApprovalStatus}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-responsive-xl font-bold text-slate-900 dark:text-slate-100">Group Members</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            View all group members and their status
          </p>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="card p-12 sm:p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg">No members found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {members.map((member) => (
              <div key={member._id || member.id} className="card card-hover p-5 sm:p-6">
                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
                  {member.profilePic ? (
                    <img
                      src={member.profilePic}
                      alt={member.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">{member.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { mode: 'personal', withUser: { _id: member._id || member.id, name: member.name } } }))}
                    className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Chat
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Mobile:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">KYC Status:</span>
                    <span className={`badge ${getKYCStatusColor(member.kycStatus)}`}>
                      {member.kycStatus || 'pending'}
                    </span>
                  </div>
                  {member.contributionStatus && member.contributionStatus.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Contributions:</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {member.contributionStatus.filter((c) => c.status === 'done').length} approved
                      </span>
                    </div>
                  )}
                  {member.loanInfo && member.loanInfo.totalLoans > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Loan Summary</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Total:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">₹{member.loanInfo.totalLoanAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Pending:</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">₹{member.loanInfo.totalPendingAmount.toFixed(2).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Paid:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{member.loanInfo.totalPaidAmount.toFixed(2).toLocaleString('en-IN')}</span>
                        </div>
                        {member.loanInfo.activeLoans > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {member.loanInfo.activeLoans} active loan{member.loanInfo.activeLoans > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

