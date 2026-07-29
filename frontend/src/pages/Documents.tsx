import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileUp, Trash2, Loader2, AlertCircle, File as FileIcon, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { documentApi } from '../api/documents';
import { UploadModal } from '../components/documents/UploadModal';
import type { Document, DocumentStatus } from '../types/document';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<DocumentStatus, { label: string; color: "default" | "secondary" | "outline" | "success" | "warning" | "danger"; icon: any }> = {
  PENDING: { label: 'Queued', color: 'default', icon: Clock },
  PROCESSING: { label: 'Processing', color: 'warning', icon: Loader2 },
  COMPLETED: { label: 'Ready', color: 'success', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'danger', icon: AlertTriangle },
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await documentApi.listDocuments();
      setDocuments(response.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Set up polling for processing documents
    const interval = setInterval(() => {
      setDocuments(currentDocs => {
        const hasProcessing = currentDocs.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
        if (hasProcessing) {
          fetchDocuments();
        }
        return currentDocs;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will remove all generated AI context for this file.')) return;
    
    try {
      await documentApi.deleteDocument(id);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Study Materials</h1>
          <p className="text-surface-500 mt-1">Upload and manage your documents for the AI tutor</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} leftIcon={<FileUp className="w-4 h-4" />}>
          Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-surface-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading documents...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <AlertCircle className="w-8 h-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center text-surface-400 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-surface-900 mb-2">No documents yet</h3>
              <p className="text-surface-500 max-w-sm mb-6">
                Upload your course notes, slides, or reading materials to start asking questions to your AI tutor.
              </p>
              <Button onClick={() => setIsUploadOpen(true)} variant="outline">
                Upload your first file
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {documents.map((doc) => {
                const StatusIcon = statusConfig[doc.status].icon;
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={doc.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-surface-50 transition-colors gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <FileIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-surface-900">{doc.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-surface-500">
                          <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                          {doc.error_message && (
                            <>
                              <span>•</span>
                              <span className="text-red-500 max-w-xs truncate" title={doc.error_message}>
                                {doc.error_message}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <Badge variant={statusConfig[doc.status].color} className="flex items-center gap-1.5 px-2.5 py-1">
                        <StatusIcon className={`w-3.5 h-3.5 ${doc.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                        {statusConfig[doc.status].label}
                      </Badge>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={() => {
          fetchDocuments();
        }}
      />
    </div>
  );
}
