'use client';
import { useState, useEffect } from 'react';
import { Settings, Save, DollarSign, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminSetupClient() {
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchCurrentGroup();
  }, []);

  const fetchCurrentGroup = async () => {
    try {
      const response = await fetch('/api/admin/setup-group');
      const data = await response.json();
      if (data.ok && data.monthlyAmount) {
        setCurrentGroup({ monthlyAmount: data.monthlyAmount });
        setMonthlyAmount(data.monthlyAmount.toString());
      }
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!monthlyAmount || isNaN(Number(monthlyAmount))) {
      setMessage('Please enter a valid monthly amount');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/setup-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyAmount: Number(monthlyAmount) }),
      });

      const data = await response.json();
      if (data.ok) {
        setCurrentGroup({ monthlyAmount: Number(monthlyAmount) });
        setMessage('Monthly amount saved successfully!');
        setMessageType('success');
      } else {
        setMessage('Failed to save monthly amount');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to save monthly amount');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading group settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Group Setup
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Configure group settings and monthly contribution amounts
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl border p-4 animate-fade-in ${
          messageType === 'success' 
            ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
            : 'border-red-200 bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center space-x-2">
            {messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <p className={`font-medium ${
              messageType === 'success' 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {message}
            </p>
          </div>
        </div>
      )}

      {/* Setup Form */}
      <div className="card p-8">
        <div className="space-y-8">
          {/* Monthly Amount Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Monthly Contribution</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Amount (₹) *
                </label>
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="Enter monthly amount"
                  className="input-modern"
                  min="1"
                  step="1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This amount will be used to calculate remaining contribution for each user
                </p>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !monthlyAmount}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Current Settings */}
          {currentGroup && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Current Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Group Name</p>
                      <p className="text-lg font-bold text-blue-800 dark:text-blue-200">Mandal Book</p>
                    </div>
                  </div>
                </div>
                
                <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Monthly Amount</p>
                      <p className="text-lg font-bold text-green-800 dark:text-green-200">
                        ₹{currentGroup.monthlyAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Last Updated</p>
                      <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Notice */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 dark:text-blue-400 mt-1">ℹ</div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• The monthly amount affects all users contribution calculations</li>
              <li>• Changes will apply to new contributions immediately</li>
              <li>• Existing contributions will retain their original required amounts</li>
              <li>• This setting cannot be changed frequently to maintain consistency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}



