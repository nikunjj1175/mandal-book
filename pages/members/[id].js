import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function MemberProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!id) return;
    const fetchMember = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/admin/members/${id}`);
        if (response.data.success) {
          setMember(response.data.data.member);
          setFormData({
            kycStatus: response.data.data.member.kycStatus || 'pending',
            adminApprovalStatus: response.data.data.member.adminApprovalStatus || 'pending',
            adminApprovalRemarks: response.data.data.member.adminApprovalRemarks || '',
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load member');
        router.push('/members');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      const response = await api.put(`/api/admin/members/${id}`, formData);
      if (response.data.success) {
        toast.success('Member updated successfully');
        setMember(response.data.data.member);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!member) return null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:text-blue-500 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Members
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-sm text-gray-500">Joined {new Date(member.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span
                className={`rounded-full px-4 py-1 text-xs font-semibold capitalize ${
                  member.kycStatus === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : member.kycStatus === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                KYC: {member.kycStatus}
              </span>
              <span
                className={`rounded-full px-4 py-1 text-xs font-semibold capitalize ${
                  member.adminApprovalStatus === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : member.adminApprovalStatus === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                Approval: {member.adminApprovalStatus || 'pending'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl bg-white shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            <div className="text-sm text-gray-700 space-y-3">
              <p>
                <span className="font-medium">Email:</span> {member.email}
              </p>
              <p>
                <span className="font-medium">Mobile:</span> {member.mobile}
              </p>
              <p>
                <span className="font-medium">Address:</span> {member.address || '—'}
              </p>
              <p>
                <span className="font-medium">DOB:</span> {member.dob || '—'}
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl bg-white shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900">Admin Controls</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KYC Status</label>
                <select
                  name="kycStatus"
                  value={formData.kycStatus}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {['pending', 'under_review', 'verified', 'rejected'].map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                <select
                  name="adminApprovalStatus"
                  value={formData.adminApprovalStatus}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {['pending', 'approved', 'rejected'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Remarks</label>
                <textarea
                  name="adminApprovalRemarks"
                  value={formData.adminApprovalRemarks}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Add remarks for the member"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2 rounded-2xl bg-white shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900">KYC Documents</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {member.aadhaarFront && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Aadhaar Front</p>
                  <img src={member.aadhaarFront} alt="Aadhaar Front" className="rounded-lg border" />
                </div>
              )}
              {member.aadhaarBack && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Aadhaar Back</p>
                  <img src={member.aadhaarBack} alt="Aadhaar Back" className="rounded-lg border" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl bg-white shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900">PAN & Passbook</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {member.panImage && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">PAN</p>
                  <img src={member.panImage} alt="PAN" className="rounded-lg border" />
                </div>
              )}
              {member.bankDetails?.passbookImage && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Passbook</p>
                  <img src={member.bankDetails.passbookImage} alt="Passbook" className="rounded-lg border" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

