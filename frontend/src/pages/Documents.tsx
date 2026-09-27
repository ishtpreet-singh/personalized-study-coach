import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  FileUp, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  File as FileIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { documentApi } from '../api/documents';
import { UploadModal } from '../components/documents/UploadModal';
import type { Document } from '../types/document';
import type { Subject } from '../types/subject';
import { formatDistanceToNow } from 'date-fns';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const statusConfig: Record<string, { label: string; color: "default" | "secondary" | "outline" | "success" | "warning" | "danger"; icon: any; isAnimated: boolean; progressMessage: string }> = {
  PENDING: { label: 'Queued', color: 'default', icon: Clock, isAnimated: false, progressMessage: 'Waiting in queue...' },
  PROCESSING: { label: 'Processing', color: 'warning', icon: Loader2, isAnimated: true, progressMessage: 'Uploading and chunking document...' },
  TUTOR_READY: { label: 'Tutor Ready', color: 'success', icon: BookOpen, isAnimated: false, progressMessage: 'AI Tutor is ready. Generating quizzes...' },
  EXTRACTING_TOPICS: { label: 'Finding Topics', color: 'warning', icon: BookOpen, isAnimated: true, progressMessage: 'Extracting educational concepts...' },
  GENERATING_QUESTIONS: { label: 'Making Quizzes', color: 'warning', icon: Sparkles, isAnimated: true, progressMessage: 'Generating AI question bank...' },
  COMPLETED: { label: 'Ready', color: 'success', icon: CheckCircle2, isAnimated: false, progressMessage: 'Ready for quizzes' },
  FAILED: { label: 'Failed', color: 'danger', icon: AlertTriangle, isAnimated: false, progressMessage: 'Processing failed' },
};

export default function Documents() {
  const { subjectId } = useOutletContext<{ subject: Subject, subjectId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await documentApi.listDocuments(0, 100, subjectId);
      setDocuments(response.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Set up polling for any document in a pending or in-progress state
    const interval = setInterval(() => {
      setDocuments(currentDocs => {
        const hasProcessing = currentDocs.some(
          d => ['PENDING', 'PROCESSING', 'TUTOR_READY', 'EXTRACTING_TOPICS', 'GENERATING_QUESTIONS'].includes(d.status)
        );
        if (hasProcessing) {
          fetchDocuments();
        }
        return currentDocs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [subjectId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will remove all generated AI context for this file.')) return;
    
    try {
      await documentApi.deleteDocument(id);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await documentApi.retryDocument(id);
      toast.success('Document re-queued for processing');
      fetchDocuments();
    } catch (error) {
      console.error('Failed to retry document', error);
      toast.error('Failed to restart processing');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full overflow-y-auto p-6 md:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Study Materials</h2>
          <p className="text-sm text-surface-500 mt-1">Upload documents to expand your AI tutor's knowledge.</p>
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
              <AnimatePresence>
                {documents.map((doc) => {
                  const config = statusConfig[doc.status] || { 
                    label: doc.status, 
                    color: "default", 
                    icon: FileIcon, 
                    isAnimated: false, 
                    progressMessage: 'Unknown state' 
                  };
                  const StatusIcon = config.icon;
                  
                  return (
                    <motion.div 
                      key={doc.id} 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-surface-50 transition-colors gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          doc.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                          doc.status === 'FAILED' ? 'bg-red-50 text-red-600' :
                          'bg-primary-50 text-primary-600'
                        }`}>
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-surface-900">{doc.title}</h4>
                          <motion.p 
                            key={config.progressMessage}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-sm mt-0.5 ${
                              doc.status === 'FAILED' ? 'text-red-500' : 
                              doc.status === 'COMPLETED' ? 'text-green-600' : 
                              'text-primary-600 font-medium'
                            }`}
                          >
                            {config.progressMessage}
                          </motion.p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-surface-500">
                            <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                          </div>
                          
                          {/* Failure details if FAILED */}
                          {doc.status === 'FAILED' && (() => {
                            const raw = (doc.error_message || '').trim();
                            // Show a fallback if the message is empty or is only the bare prefix
                            const display = (raw && raw !== 'Learning Pipeline Error:')
                              ? raw
                              : 'Processing failed. Please use Retry Processing. If the problem persists, check the backend logs.';
                            return (
                              <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                  <p className="text-xs text-red-800 break-words line-clamp-3">
                                    {display}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        {doc.status === 'FAILED' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRetry(doc.id)}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          >
                            Retry Processing
                          </Button>
                        )}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={doc.status}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge variant={config.color} className="flex items-center gap-1.5 px-3 py-1.5 shadow-sm">
                              <StatusIcon className={`w-3.5 h-3.5 ${config.isAnimated ? 'animate-spin text-primary-600' : ''}`} />
                              {config.label}
                            </Badge>
                          </motion.div>
                        </AnimatePresence>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 ml-1 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        subjectId={subjectId}
        onSuccess={() => {
          fetchDocuments();
        }}
      />
    </div>
  );
}
