import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'react-hot-toast';

import { quizzesApi } from "../../api/quizzes";
import { Button } from "../../components/ui/Button";

export default function QuizPlayer() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { subjectId } = useOutletContext<{ subject: any, subjectId: string }>();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Timer State (Visual only, actual time should be managed by backend on submit)
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttempt = async () => {
    try {
      const data = await quizzesApi.getAttempt(attemptId!);
      if (data.completed_at) {
        navigate(`/subjects/${subjectId}/quizzes/result/${attemptId}`, { replace: true });
        return;
      }
      setAttempt(data);
      // Pre-fill answers only for questions that have already been answered (user_answer is non-null)
      const initialAnswers: Record<string, string> = {};
      data.answers.forEach((ans: any) => {
        if (ans.user_answer !== null && ans.user_answer !== undefined) {
          initialAnswers[ans.question_id] = ans.user_answer;
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Failed to load attempt", error);
      navigate(`/subjects/${subjectId}/quizzes`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const totalQuestions = attempt.answers.length;
    const answeredCount = Object.keys(answers).length;
    
    if (answeredCount < totalQuestions) {
      if (!confirm(`You have only answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`)) {
        return;
      }
    }
    
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      attempt.answers.forEach((ans: any) => {
        const userAnswer = answers[ans.question.id];
        // Only include answers that are non-null strings (backend rejects null for Dict[str, str])
        if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
          payload[ans.id] = userAnswer;
        }
      });
      console.log("QUIZ SUBMIT PAYLOAD:", JSON.stringify(payload, null, 2));
      await quizzesApi.submitAttempt(attemptId!, payload);
      navigate(`/subjects/${subjectId}/quizzes/result/${attemptId}`);
    } catch (error: any) {
      console.error("Failed to submit quiz", error);
      const detail = error.response?.data?.detail;
      let errorMessage: string;
      if (Array.isArray(detail)) {
        // Pydantic 422 returns an array of {loc, msg, type}
        errorMessage = detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('; ');
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else {
        errorMessage = error.message || "Please try again.";
      }
      toast.error(`Unable to submit quiz: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-surface-500 font-medium">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  const questions = attempt.answers.map((a: any) => a.question);
  const currentQ = questions[currentIndex];
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-50 flex flex-col">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-surface-200 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to exit? Your progress is saved.")) navigate(`/subjects/${subjectId}/quizzes`);
            }}
            className="p-2 text-surface-400 hover:text-surface-900 transition-colors rounded-lg hover:bg-surface-100"
            title="Exit Quiz"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-bold text-surface-900">{attempt.quiz.title}</h1>
            <p className="text-xs text-surface-500 capitalize">{attempt.mode.toLowerCase()} Mode</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-surface-600 font-medium font-mono bg-surface-100 px-3 py-1.5 rounded-lg">
            <Clock size={16} />
            {formatTime(timeElapsed)}
          </div>
          <div className="flex items-center gap-2 text-sm text-surface-500">
            {saving ? <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin"/> Saving...</span> : <span className="flex items-center gap-1 text-green-600"><Check size={14}/> Saved</span>}
          </div>
          <Button variant="primary" onClick={handleSubmit} className="shadow-glow-primary">
            Submit Quiz
          </Button>
        </div>
      </header>

      {/* Progress Bar (Global) */}
      <div className="w-full h-1 bg-surface-200">
        <motion.div 
          className="h-full bg-primary-500"
          initial={{ width: 0 }}
          animate={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question Navigator */}
        <aside className="w-20 lg:w-64 bg-white border-r border-surface-200 overflow-y-auto shrink-0 hidden sm:flex flex-col p-4">
          <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4 hidden lg:block">Questions</h3>
          <div className="flex flex-col gap-2">
            {questions.map((q: any, idx: number) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center lg:justify-start justify-center p-2 rounded-xl transition-all ${
                    isCurrent 
                      ? 'bg-primary-50 ring-1 ring-primary-200' 
                      : 'hover:bg-surface-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-primary-500 text-white shadow-md' : 
                    isAnswered ? 'bg-surface-800 text-white' : 'bg-surface-100 text-surface-500'
                  }`}>
                    <span className="text-sm font-bold">{idx + 1}</span>
                  </div>
                  <span className={`ml-3 text-sm font-medium hidden lg:block truncate ${
                    isCurrent ? 'text-primary-900' : 
                    isAnswered ? 'text-surface-900' : 'text-surface-500'
                  }`}>
                    {isAnswered ? 'Answered' : 'Not Answered'}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Question Card */}
        <main className="flex-1 overflow-y-auto bg-surface-50/50 p-4 sm:p-8 flex justify-center">
          <div className="w-full max-w-3xl flex flex-col max-h-full">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <div className="bg-white rounded-3xl shadow-sm border border-surface-200 p-8 sm:p-12 h-full flex flex-col relative overflow-hidden">
                  
                  {/* Subtle topic badge */}
                  {currentQ.topic && (
                    <div className="absolute top-6 left-8 bg-surface-100 text-surface-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {currentQ.topic}
                    </div>
                  )}

                  <div className="mt-8 mb-10">
                    <span className="text-primary-500 font-bold text-lg mb-2 block">Question {currentIndex + 1} of {questions.length}</span>
                    <h2 className="text-2xl sm:text-3xl font-display font-medium text-surface-900 leading-tight">
                      {currentQ.question_text}
                    </h2>
                  </div>

                  {/* Options (MCQ / TF) */}
                  {(currentQ.question_type === 'MCQ' || currentQ.question_type === 'TF') && (
                    <div className="space-y-3 mt-auto">
                      {currentQ.options?.map((opt: string, i: number) => {
                        const isSelected = answers[currentQ.id] === opt;
                        const letters = ['A', 'B', 'C', 'D', 'E'];
                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectAnswer(currentQ.id, opt)}
                            className={`w-full flex items-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                              isSelected 
                                ? 'border-primary-500 bg-primary-50/50' 
                                : 'border-surface-200 bg-white hover:border-primary-200 hover:bg-surface-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-4 font-bold text-sm transition-colors ${
                              isSelected ? 'bg-primary-500 text-white shadow-md' : 'bg-surface-100 text-surface-600'
                            }`}>
                              {letters[i]}
                            </div>
                            <span className={`text-left text-lg ${isSelected ? 'text-primary-900 font-medium' : 'text-surface-800'}`}>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer / Fill in the Blank */}
                  {(currentQ.question_type === 'SA' || currentQ.question_type === 'FIB') && (
                    <div className="mt-auto">
                      <textarea 
                        className="w-full h-32 p-4 bg-surface-50 border-2 border-surface-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:bg-white transition-colors resize-none text-lg text-surface-900 placeholder:text-surface-400"
                        placeholder="Type your answer here..."
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                      />
                    </div>
                  )}

                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between mt-6 px-2">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                leftIcon={<ChevronLeft size={20} />}
                className="bg-white"
              >
                Previous
              </Button>
              
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                rightIcon={<ChevronRight size={20} />}
                className="shadow-glow-primary"
              >
                Next
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Minimal dummy Loader2 to prevent missing import error if it happened. (Already imported from lucide-react)
