import { useState, useRef } from 'react';
import { UploadCloud, X, File as FileIcon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { documentApi } from '../../api/documents';
import type { Document } from '../../types/document';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (doc: Document) => void;
  subjectId: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png'
];

export function UploadModal({ isOpen, onClose, onSuccess, subjectId }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF, DOCX, PPTX, TXT, XLSX, JPG, or PNG file.');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File is too large. Maximum size is 50MB.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const doc = await documentApi.uploadDocument(file, subjectId);
      setIsUploading(false);
      setIsSuccess(true);
      onSuccess?.(doc);
      setTimeout(() => {
        handleClose();
      }, 1500); // give time for success animation
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document. Please try again.');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setIsUploading(false);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Study Material"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isUploading || isSuccess}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading || isSuccess}
            className="min-w-[120px] bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white shadow-md shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-[2px] active:scale-[0.98] transition-all duration-200 border-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Uploaded
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative group border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ease-in-out
              ${isDragging 
                ? 'border-blue-500 bg-blue-50/50' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
              }
            `}
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-700 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">
              Drag files here or click to browse
            </h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Supported formats: PDF, DOCX, PPTX, TXT, XLSX, JPG, PNG
            </p>
            <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              Max file size: 50MB
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.pptx,.txt,.xlsx,.jpg,.jpeg,.png"
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
            {/* Background progress indicator (simulated during upload) */}
            {isUploading && (
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 10, ease: "linear" }}
                className="absolute inset-0 bg-blue-50/50 -z-10"
              />
            )}
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
              ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}
            `}>
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate pr-4">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-500 font-medium">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {isUploading && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <p className="text-xs text-blue-600 font-semibold animate-pulse">Uploading...</p>
                  </>
                )}
                {isSuccess && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <p className="text-xs text-green-600 font-semibold">Success</p>
                  </>
                )}
              </div>
            </div>
            
            {!isUploading && !isSuccess && (
              <button 
                onClick={() => setFile(null)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <p className="leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
