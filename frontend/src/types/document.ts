export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'TUTOR_READY' | 'EXTRACTING_TOPICS' | 'GENERATING_QUESTIONS' | 'COMPLETED' | 'FAILED';

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  error_message: string | null;
  failed_stage: string | null;
  failed_at: string | null;
  retry_count: number;
  quiz_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
}
