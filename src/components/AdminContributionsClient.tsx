'use client';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useSocket } from '@/hooks/useSocket';
import { 
  fetchPendingContributions, 
  fetchVerifiedContributions,
  verifyContribution,
  finalizeContribution,
  setFilters,
  clearError 
} from '@/store/slices/contributionsSlice';
import { useToast } from '@/hooks/useToast';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Filter, 
  Search,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';

export default function AdminContributionsClient() {
  const dispatch = useAppDispatch();
  const { pendingItems, verifiedItems, loading, error, filters } = useAppSelector((state: any) => state.contributions);
  const { user } = useAppSelector((state: any) => state.auth);
  const { connected, joinAdminRoom, leaveAdminRoom, emit } = useSocket();
  const toast = useToast();

  // Connect to socket and join admin room
  useEffect(() => {
    if (connected && user?.role === 'admin') {
      joinAdminRoom();
      return () => leaveAdminRoom();
    }
  }, [connected, user?.role, joinAdminRoom, leaveAdminRoom]);

  // Load data on mount
  useEffect(() => {
    dispatch(fetchPendingContributions());
    dispatch(fetchVerifiedContributions(filters));
  }, [dispatch, filters]);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleVerify = async (id: string, action: 'verify' | 'reject') => {
    try {
      await dispatch(verifyContribution({ id, action })).unwrap();
      
      // Emit socket event for real-time updates
      if (connected) {
        emit('contribution:verify', {
          contributionId: id,
          status: action === 'verify' ? 'verified' : 'rejected',
          userId: pendingItems.find((item: any) => item._id === id)?.userId?._id,
          userName: pendingItems.find((item: any) => item._id === id)?.userId?.name
        });
      }

      toast.success(`Contribution ${action === 'verify' ? 'approved' : 'rejected'} successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} contribution`);
    }
  };

  const handleFinalize = async (id: string) => {
    try {
      await dispatch(finalizeContribution(id)).unwrap();
      
      // Emit socket event for real-time updates
      if (connected) {
        emit('contribution:finalize', {
          contributionId: id,
          userId: verifiedItems.find((item: any) => item._id === id)?.userId?._id,
          userName: verifiedItems.find((item: any) => item._id === id)?.userId?.name
        });
      }

      toast.success('Contribution finalized successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize contribution');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
  };

  if (error) {
    return (
      <div className="card p-6 border-red-200 bg-red-50 dark:bg-red-900/20 animate-fade-in">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Contributions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pending Verification</h2>
          </div>
          <div className="badge badge-warning">
            {pendingItems.length} items pending
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading pending contributions...</p>
            </div>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">All Caught Up!</h3>
            <p className="text-gray-600 dark:text-gray-400">No pending items to verify.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="relative">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>User</span>
                        <input
                          type="text"
                          placeholder="Filter by name..."
                          className="input-modern text-xs py-1"
                          onChange={(e) => handleFilterChange('userName', e.target.value)}
                        />
                      </div>
                    </th>
                    <th className="relative">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Period</span>
                        <input
                          type="text"
                          placeholder="YYYY-MM"
                          className="input-modern text-xs py-1"
                          onChange={(e) => handleFilterChange('period', e.target.value)}
                        />
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>Amount</span>
                      </div>
                    </th>
                    <th>Required</th>
                    <th>Remaining</th>
                    <th>UTR</th>
                    <th>Proof</th>
                    <th>Payments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map((item: any) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="font-medium">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{item.userId?.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.userId?.email}</div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{item.period}</td>
                      <td className="font-semibold text-green-600 dark:text-green-400">₹{item.amount?.toLocaleString()}</td>
                      <td className="text-gray-600 dark:text-gray-400">₹{item.required?.toLocaleString() ?? '-'}</td>
                      <td className={`font-semibold ${item.remaining && item.remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ₹{item.remaining?.toLocaleString() ?? '-'}
                      </td>
                      <td className="font-mono text-xs">{item.utr}</td>
                      <td>
                        {item.proof?.url ? (
                          <a href={item.proof.url} target="_blank" rel="noreferrer" className="block group">
                            <img src={item.proof.url} alt="Proof" className="h-16 w-16 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-400 transition-all duration-200" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        {item.payments?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {item.payments.map((payment: any, idx: number) => (
                              <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700">
                                <div className="text-xs font-semibold text-green-600 dark:text-green-400">₹{payment.amount}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}
                                </div>
                                {payment.proof?.url && (
                                  <a href={payment.proof.url} target="_blank" rel="noreferrer" className="block mt-1">
                                    <img src={payment.proof.url} alt="p" className="h-10 w-10 rounded object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerify(item._id, 'verify')}
                            className="btn-success text-xs py-2 px-3 flex items-center space-x-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => handleVerify(item._id, 'reject')}
                            className="btn-danger text-xs py-2 px-3 flex items-center space-x-1"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Verified Contributions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Verified Contributions</h2>
          </div>
          <div className="badge badge-success">
            {verifiedItems.length} items verified
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th className="relative">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>User</span>
                      <input
                        type="text"
                        placeholder="Filter by name..."
                        className="input-modern text-xs py-1"
                        onChange={(e) => handleFilterChange('userName', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="relative">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Period</span>
                      <input
                        type="text"
                        placeholder="Start (YYYY-MM)"
                        className="input-modern text-xs py-1"
                        value={filters.start}
                        onChange={(e) => handleFilterChange('start', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="relative">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>End Period</span>
                      <input
                        type="text"
                        placeholder="End (YYYY-MM)"
                        className="input-modern text-xs py-1"
                        value={filters.end}
                        onChange={(e) => handleFilterChange('end', e.target.value)}
                      />
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>Amount</span>
                    </div>
                  </th>
                  <th>UTR</th>
                  <th>Proof</th>
                  <th>Payments</th>
                  <th className="relative">
                    <div className="flex items-center space-x-2">
                      <span>Status</span>
                      <select
                        value={filters.finalized}
                        onChange={(e) => handleFilterChange('finalized', e.target.value)}
                        className="select-modern text-xs py-1"
                      >
                        <option value="false">Awaiting finalize</option>
                        <option value="true">Finalized</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifiedItems.map((item: any) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="font-medium">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{item.userId?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.userId?.email}</div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{item.period}</td>
                    <td className="font-mono text-sm">{filters.end || 'All'}</td>
                    <td className="font-semibold text-green-600 dark:text-green-400">₹{item.amount?.toLocaleString()}</td>
                    <td className="font-mono text-xs">{item.utr}</td>
                    <td>
                      {item.proof?.url ? (
                        <a href={item.proof.url} target="_blank" rel="noreferrer" className="block group">
                          <img src={item.proof.url} alt="Proof" className="h-16 w-16 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-400 transition-all duration-200" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {item.payments?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {item.payments.map((payment: any, idx: number) => (
                            <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700">
                              <div className="text-xs font-semibold text-green-600 dark:text-green-400">₹{payment.amount}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}
                              </div>
                              {payment.proof?.url && (
                                <a href={payment.proof.url} target="_blank" rel="noreferrer" className="block mt-1">
                                  <img src={payment.proof.url} alt="p" className="h-10 w-10 rounded object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        item.finalized 
                          ? 'badge-success' 
                          : 'badge-warning'
                      }`}>
                        {item.finalized ? 'Finalized' : 'Awaiting'}
                      </span>
                    </td>
                    <td>
                      {!item.finalized && (
                        <button
                          onClick={() => handleFinalize(item._id)}
                          className="btn-primary text-xs py-2 px-3 flex items-center space-x-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Finalize</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
