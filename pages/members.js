import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import PendingApprovalMessage from '@/components/PendingApproval';
import { useGetMembersQuery } from '@/store/api/membersApi';

export default function Members() {
  const { user } = useAuth();

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
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Group Members</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {members.map((member) => (
              <div key={member._id || member.id} className="bg-white dark:bg-slate-800 shadow-lg dark:shadow-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {member.profilePic ? (
                    <img
                      src={member.profilePic}
                      alt={member.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-300 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-300">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="ml-4 min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Mobile: </span>
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">{member.mobile}</span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">KYC Status: </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getKYCStatusColor(member.kycStatus)}`}>
                      {member.kycStatus || 'pending'}
                    </span>
                  </div>
                  {member.contributionStatus && member.contributionStatus.length > 0 && (
                    <div>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Contributions: </span>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {member.contributionStatus.filter((c) => c.status === 'done').length} approved
                      </span>
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

