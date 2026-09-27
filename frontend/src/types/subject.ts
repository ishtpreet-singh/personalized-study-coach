export interface Subject {
  id: string;
  user_id: string;
  name: string;
  semester?: string;
  color?: string;
  icon?: string;
  exam_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectCreate {
  name: string;
  semester?: string;
  color?: string;
  icon?: string;
  exam_date?: string;
}

export interface SubjectUpdate {
  name?: string;
  semester?: string;
  color?: string;
  icon?: string;
  exam_date?: string;
}

export interface AILearningProfile {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id?: string;
  mastery_score: number;
  confidence: number;
  quiz_accuracy: number;
  times_studied: number;
  times_revised: number;
  last_revision?: string;
  next_revision?: string;
  common_mistakes?: string[];
  learning_insights?: string[];
  created_at: string;
  updated_at: string;
}
