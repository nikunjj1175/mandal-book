import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UploadDocumentClient from '@/components/UploadDocumentClient';

export default async function UploadDocumentPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to upload documents.
          </p>
          <a 
            href="/signin"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>Sign In</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Upload Documents
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Securely upload and manage your documents with our advanced cloud storage system
        </p>
      </div>

      {/* Upload Client */}
      <UploadDocumentClient />
    </div>
  );
}