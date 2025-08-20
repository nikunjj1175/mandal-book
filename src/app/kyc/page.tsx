"use client";
import { FormEvent, useState } from 'react';
import { User, CreditCard, MapPin, Building, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KycPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement & {
      name: { value: string };
      aadhaarNumber: { value: string };
      panNumber: { value: string };
      addressLine1: { value: string };
      city: { value: string };
      state: { value: string };
      postalCode: { value: string };
      accountHolderName: { value: string };
      accountNumber: { value: string };
      ifsc: { value: string };
      bankName: { value: string };
      branch: { value: string };
    };

    try {
    const res = await fetch('/api/users/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        aadhaarNumber: form.aadhaarNumber.value,
        panNumber: form.panNumber.value,
        address: {
          line1: form.addressLine1.value,
          city: form.city.value,
          state: form.state.value,
          postalCode: form.postalCode.value
        },
        bank: {
          accountHolderName: form.accountHolderName.value,
          accountNumber: form.accountNumber.value,
          ifsc: form.ifsc.value,
          bankName: form.bankName.value,
          branch: form.branch.value
        }
      })
    });

      if (res.ok) {
        setMessage('KYC information saved successfully!');
        // Reset form after successful submission
        e.currentTarget.reset();
      } else {
        setError('Failed to save KYC information. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4">
          <Link 
            href="/profile" 
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            KYC Information
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Update your Know Your Customer (KYC) details for secure transactions
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <div className="text-green-600 dark:text-green-400">✓</div>
            <p className="text-green-800 dark:text-green-200 font-medium">{message}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 animate-fade-in">
          <div className="flex items-center space-x-2">
            <div className="text-red-600 dark:text-red-400">⚠</div>
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* KYC Form */}
      <div className="card p-8">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input 
                  name="name" 
                  placeholder="Enter your full name" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aadhaar Number
                </label>
                <input 
                  name="aadhaarNumber" 
                  placeholder="XXXX-XXXX-XXXX" 
                  className="input-modern" 
                  maxLength={12}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PAN Number
                </label>
                <input 
                  name="panNumber" 
                  placeholder="ABCDE1234F" 
                  className="input-modern" 
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Address Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address Line 1 *
                </label>
                <input 
                  name="addressLine1" 
                  placeholder="Street address, apartment, suite, etc." 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City *
                </label>
                <input 
                  name="city" 
                  placeholder="Enter city name" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State *
                </label>
                <input 
                  name="state" 
                  placeholder="Enter state name" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Postal Code *
                </label>
                <input 
                  name="postalCode" 
                  placeholder="Enter postal code" 
                  className="input-modern" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Bank Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Holder Name *
                </label>
                <input 
                  name="accountHolderName" 
                  placeholder="Name as it appears on bank account" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Number *
                </label>
                <input 
                  name="accountNumber" 
                  placeholder="Enter account number" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IFSC Code *
                </label>
                <input 
                  name="ifsc" 
                  placeholder="Enter IFSC code" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bank Name *
                </label>
                <input 
                  name="bankName" 
                  placeholder="Enter bank name" 
                  className="input-modern" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch *
                </label>
                <input 
                  name="branch" 
                  placeholder="Enter branch name" 
                  className="input-modern" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save KYC Information</span>
                </>
              )}
            </button>
            
            <Link 
              href="/profile" 
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Profile</span>
            </Link>
          </div>
      </form>
      </div>

      {/* Information Notice */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 dark:text-blue-400 mt-1">ℹ</div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• All information provided will be encrypted and stored securely</li>
              <li>• KYC verification is required for contribution processing</li>
              <li>• Please ensure all details match your official documents</li>
              <li>• Fields marked with * are mandatory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}