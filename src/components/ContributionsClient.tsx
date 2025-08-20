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

export default function ContributionsClient() {
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

      toast.success('Contribution submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
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
      
      toast.success('File uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Filter by month</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={filters.start}
            onChange={(e) => handleFilterChange('start', e.target.value)}
            placeholder="Start (YYYY-MM)"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={filters.end}
            onChange={(e) => handleFilterChange('end', e.target.value)}
            placeholder="End (YYYY-MM)"
            className="rounded-md border px-3 py-2"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="rounded-md border px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => dispatch(fetchMyContributions())}
            className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Submit Form */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Submit contribution</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            className="rounded-md border px-3 py-2"
          />
          <input
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="UPI UTR"
            className="rounded-md border px-3 py-2"
          />
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="rounded-md border px-3 py-2"
          />
        </div>
                 <button
           onClick={handleSubmit}
           disabled={submitting || loading || !amount || !utr || !proofUrl}
           className="mt-3 rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
         >
           {submitting ? 'Submitting...' : 'Submit'}
         </button>
        {proofUrl && (
          <div className="mt-2">
            <img src={proofUrl} alt="Proof" className="h-20 w-20 rounded object-cover" />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs">
          <p className="font-medium text-blue-800 mb-2">Debug Info:</p>
          <p>Monthly Amount: {monthlyAmount}</p>
          <p>Items Count: {items.length}</p>
          {items.length > 0 && (
            <p>First Item: {JSON.stringify({
              amount: items[0]?.amount,
              required: items[0]?.required,
              remaining: items[0]?.remaining,
              period: items[0]?.period
            }, null, 2)}</p>
          )}
        </div>
      )}

      {/* Contributions List */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Your contributions</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-2">Period</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Required</th>
                  <th className="p-2">Remaining</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Proof</th>
                  <th className="p-2">Payments</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item._id} className="border-b">
                    <td className="p-2">{item.period}</td>
                    <td className="p-2">₹{item.amount || 0}</td>
                    <td className="p-2">₹{item.required || monthlyAmount || 0}</td>
                    <td className={`p-2 ${item.remaining && item.remaining > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ₹{item.remaining !== undefined ? item.remaining : (item.required || monthlyAmount || 0) - (item.amount || 0)}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'verified' ? 'bg-green-100 text-green-800' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2">
                      {item.proof?.url ? (
                        <a href={item.proof.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-2">
                      {item.payments?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {item.payments.map((payment: any, idx: number) => (
                            <div key={idx} className="rounded border p-1 text-xs">
                              <div>₹{payment.amount}</div>
                              {payment.proof?.url && (
                                <a href={payment.proof.url} target="_blank" rel="noopener noreferrer">
                                  <img src={payment.proof.url} alt="p" className="mt-1 h-8 w-8 rounded object-cover" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : '-'}
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
