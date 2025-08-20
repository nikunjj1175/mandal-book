'use client';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useSocket } from '@/hooks/useSocket';
import { 
  fetchMyContributions, 
  submitContribution, 
  setFilters,
  clearError 
} from '@/store/slices/contributionsSlice';
import { useToast } from '@/hooks/useToast';
import { 
  DollarSign, 
  Upload, 
  Calendar, 
  Filter, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Search,
  Plus,
  CreditCard,
  PiggyBank,
  Target,
  FileImage,
  Loader2,
  BarChart3
} from 'lucide-react';

interface PaymentData {
  amount: number;
  utr: string;
  proof?: { url: string; publicId: string };
  createdAt?: string;
}

export default function UserContributionsClient() {
  const dispatch = useAppDispatch();
  const { items, loading, error, filters, monthlyAmount } = useAppSelector((state: any) => state.contributions);
  const { user } = useAppSelector((state: any) => state.auth);
  const { connected, joinUserRoom, leaveUserRoom, emit } = useSocket();
  const toast = useToast();

  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofPublicId, setProofPublicId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Connect to socket and join user room
  useEffect(() => {
    if (connected && user?.id) {
      joinUserRoom(user.id);
      return () => leaveUserRoom();
    }
  }, [connected, user?.id, joinUserRoom, leaveUserRoom]);

  // Load contributions on mount and when filters change
  useEffect(() => {
    dispatch(fetchMyContributions());
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

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadingProof(true);
    try {
      const sanitizeFolderName = (name: string) => {
        return String(name)
          .toLowerCase()
          .replace(/[^a-z0-9\-\s_]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      };

      const response = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          folder: `mandal-book/users/${sanitizeFolderName(user?.name || 'user')}/contributions` 
        })
      });
      
      if (!response.ok) throw new Error('Failed to get upload signature');
      
      const { cloudName, apiKey, timestamp, folder, signature } = await response.json();
      
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('api_key', apiKey);
      uploadForm.append('timestamp', timestamp);
      uploadForm.append('signature', signature);
      uploadForm.append('folder', folder);
      
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: uploadForm
      });
      
      if (!uploadResponse.ok) throw new Error('Failed to upload file');
      
      const uploadData = await uploadResponse.json();
      setProofUrl(uploadData.secure_url);
      setProofPublicId(uploadData.public_id);
      
      toast.success('Payment proof uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !utr || !proofUrl) {
      toast.error('Please fill amount, UPI UTR, and upload proof image');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        amount: Number(amount),
        utr,
      };
      
      if (proofUrl && proofPublicId) {
        payload.proof = { url: proofUrl, publicId: proofPublicId };
      }

      await dispatch(submitContribution(payload)).unwrap();
      
      // Emit socket event for real-time updates
      if (connected) {
        emit('contribution:submit', {
          userId: user?.id,
          userName: user?.name,
          contribution: { amount: Number(amount), utr, proof: payload.proof }
        });
      }

      // Reset form
      setAmount('');
      setUtr('');
      setProofUrl(null);
      setProofPublicId(null);
      setShowSubmitForm(false);

      toast.success('Contribution submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return 'badge badge-success';
      case 'rejected': return 'badge badge-danger';
      default: return 'badge badge-warning';
    }
  };

  // Calculate stats
  const totalContributed = items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
  const verifiedContributions = items?.filter((item: any) => item.status === 'verified').length || 0;
  const pendingContributions = items?.filter((item: any) => item.status === 'pending').length || 0;
  const targetAmount = monthlyAmount || 1000; // fallback target
  const progressPercentage = Math.min((totalContributed / targetAmount) * 100, 100);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Contributed</p>
              <p className="text-3xl font-bold text-green-800 dark:text-green-200">₹{totalContributed.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <PiggyBank className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Target Amount</p>
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">₹{targetAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Verified</p>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{verifiedContributions}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending</p>
              <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">{pendingContributions}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Monthly Progress</h3>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {progressPercentage.toFixed(1)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
          <span>₹{totalContributed.toLocaleString()}</span>
          <span>₹{targetAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Submit New Contribution */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Submit New Contribution</h2>
          </div>
          {!showSubmitForm && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Contribution</span>
            </button>
          )}
        </div>

        {showSubmitForm && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="input-modern pl-10"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UPI UTR Number *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter UPI UTR"
                    className="input-modern pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Proof * {uploadingProof && <span className="text-blue-600">(Uploading...)</span>}
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    accept="image/*"
                    className="input-modern"
                    disabled={uploadingProof}
                  />
                  {uploadingProof && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                </div>
                {proofUrl && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800 dark:text-green-200">Payment proof uploaded successfully</span>
                    <button
                      onClick={() => window.open(proofUrl, '_blank')}
                      className="text-green-600 hover:text-green-800 dark:hover:text-green-400"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount || !utr || !proofUrl}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Submit Contribution</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowSubmitForm(false);
                  setAmount('');
                  setUtr('');
                  setProofUrl(null);
                  setProofPublicId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filter Contributions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start || ''}
              onChange={(e) => handleFilterChange('start', e.target.value)}
              className="input-modern"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.end || ''}
              onChange={(e) => handleFilterChange('end', e.target.value)}
              className="input-modern"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select-modern"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => dispatch(fetchMyContributions())}
              className="btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card p-4 border-red-200 bg-red-50 dark:bg-red-900/20 animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Contributions List */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Contribution History</h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {items?.length || 0} contributions
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading contributions...</p>
          </div>
        ) : !items?.length ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Contributions Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your savings journey by submitting your first contribution.
            </p>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Submit First Contribution</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Period</span>
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>Amount</span>
                    </div>
                  </th>
                  <th>Target</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Payments</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item: any) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="font-medium">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{item.period}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold text-green-600 dark:text-green-400">
                      ₹{(item.amount || 0).toLocaleString()}
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">
                      ₹{(item.required || monthlyAmount || 0).toLocaleString()}
                    </td>
                    <td className={`font-medium ${
                      item.remaining && item.remaining > 0 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      ₹{(item.remaining !== undefined ? item.remaining : (item.required || monthlyAmount || 0) - (item.amount || 0)).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className={getStatusBadge(item.status)}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.proof?.url ? (
                        <button
                          onClick={() => window.open(item.proof.url, '_blank')}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FileImage className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {item.payments?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.payments.map((payment: any, idx: number) => (
                            <div key={idx} className="card p-2 text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                              <div className="font-semibold text-blue-800 dark:text-blue-200">₹{payment.amount}</div>
                              <div className="text-blue-600 dark:text-blue-400">
                                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}
                              </div>
                              {payment.proof?.url && (
                                <button
                                  onClick={() => window.open(payment.proof.url, '_blank')}
                                  className="mt-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <img src={payment.proof.url} alt="proof" className="h-8 w-8 rounded object-cover border" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



