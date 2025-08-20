'use client';
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Eye, 
  Trash2,
  FileImage,
  FileText,
  Loader2,
  Cloud,
  FolderPlus
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  publicId: string;
  uploadedAt: string;
}

export default function UploadDocumentClient() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-green-600 dark:text-green-400';
    if (type.includes('pdf')) return 'text-red-600 dark:text-red-400';
    if (type.includes('word') || type.includes('document')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const uploadToCloudinary = async (file: File) => {
    try {
      // Get upload signature
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'mandal-book/demo' })
      });

      if (!signRes.ok) throw new Error('Failed to get upload signature');

      const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();

      // Upload to Cloudinary
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', apiKey);
      form.append('timestamp', timestamp);
      form.append('signature', signature);
      form.append('folder', folder);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const upRes = await fetch(cloudUrl, { method: 'POST', body: form });
      
      if (!upRes.ok) throw new Error('Upload failed');
      
      const data = await upRes.json();
      return {
        id: data.public_id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.secure_url,
        publicId: data.public_id,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileUpload = useCallback(async (selectedFiles: FileList) => {
    if (!selectedFiles.length) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileId = `${file.name}-${Date.now()}`;
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          const uploadedFile = await uploadToCloudinary(file);
          newFiles.push(uploadedFile);
          
          // Complete progress
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          
          toast.success(`${file.name} uploaded successfully!`);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          console.error(`Upload failed for ${file.name}:`, error);
        }
      }

      setFiles(prev => [...prev, ...newFiles]);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File removed');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload Files</h2>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full transition-colors duration-300 ${
                dragActive ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Upload className={`h-12 w-12 transition-colors duration-300 ${
                  dragActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`} />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {dragActive ? 'Drop files here' : 'Upload your documents'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <button
                onClick={openFileDialog}
                disabled={uploading}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <FolderPlus className="h-5 w-5" />
                <span>Browse Files</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Supported formats: Images, PDF, DOC, DOCX, TXT</p>
              <p>Max file size: 10MB per file</p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Uploading files...
              </span>
            </div>
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{fileId.split('-')[0]}</span>
                  <span className="text-gray-600 dark:text-gray-400">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Uploaded Files</h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {files.map((file) => (
              <div key={file.id} className="card-hover p-4 border rounded-lg">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getFileTypeColor(file.type)} bg-opacity-10`}>
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                    
                    {/* File Preview for Images */}
                    {file.type.startsWith('image/') && (
                      <div className="mt-3">
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="View file"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.name;
                        link.click();
                      }}
                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 dark:text-blue-400 mt-1">ℹ</div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Upload Guidelines</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Files are automatically organized in secure cloud storage</li>
              <li>• All uploads are scanned for security and compliance</li>
              <li>• Documents are accessible from anywhere with proper authentication</li>
              <li>• File names should be descriptive and professional</li>
              <li>• Large files may take longer to upload depending on connection speed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}



