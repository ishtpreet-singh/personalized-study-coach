import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Sparkles, BrainCircuit, FileText, Target, Flame, Activity, CheckCircle2, ChevronRight, FileUp, PlayCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import { quizzesApi } from "../../api/quizzes";
import { documentApi } from "../../api/documents";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StatisticCard } from "../../components/quiz/StatisticCard";
import { EmptyState } from "../../components/quiz/EmptyState";

import { useOutletContext } from "react-router-dom";
import type { Subject } from "../../types/subject";

export default function QuizList() {
  const navigate = useNavigate();
  const { subject, subjectId } = useOutletContext<{ subject: Subject, subjectId: string }>();
  const [documents, setDocuments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [, docsData, historyData] = await Promise.all([
        quizzesApi.getQuizzes(0, 5, subjectId),
        documentApi.listDocuments(0, 5, subjectId), // Fetch 5 to ensure we see recent ones
        quizzesApi.getAttempts(0, 10)
      ]);
      setDocuments(docsData.items);
      setHistory(historyData.items);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      setDocuments(currentDocs => {
        const hasProcessing = currentDocs.some(
          d => ['PENDING', 'PROCESSING', 'TUTOR_READY', 'EXTRACTING_TOPICS', 'GENERATING_QUESTIONS'].includes(d.status)
        );
        if (hasProcessing) {
          documentApi.listDocuments(0, 5, subjectId).then(res => {
            setDocuments(res.items);
          });
        }
        return currentDocs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (id: string) => {
    try {
      await documentApi.retryDocument(id);
      fetchDashboardData();
      toast.success('Processing restarted');
    } catch (err) {
      toast.error('Failed to restart processing');
    }
  };

  const completedQuizzes = history.filter(h => h.completed_at);
  const avgScore = completedQuizzes.length 
    ? Math.round(completedQuizzes.reduce((acc, h) => acc + h.score, 0) / completedQuizzes.length) 
    : 0;
  
  const unfinishedAttempt = history.find(h => !h.completed_at);

  return (
    <div className="max-w-6xl mx-auto h-full overflow-y-auto p-6 md:p-8 pb-20 space-y-8 animate-fade-in">
      
      {/* 1. Welcome Section */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-gradient-to-r from-${subject.color || 'primary'}-50 to-transparent p-6 rounded-3xl border border-${subject.color || 'primary'}-100`}>
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900 tracking-tight">Practice & Master</h2>
          <p className="text-surface-600 mt-1 flex items-center text-sm">
            <Sparkles className={`w-4 h-4 text-${subject.color || 'primary'}-500 mr-2`} />
            Test your knowledge in {subject.name}
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            console.log("Navigating to quiz creation\nsubjectId:", subjectId);
            navigate(`/subjects/${subjectId}/quizzes/create`);
          }}
          leftIcon={<PlusCircle size={18} />}
          className="shadow-glow-primary rounded-full px-6"
        >
          Create AI Quiz
        </Button>
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard 
          title="Quizzes Completed" 
          value={completedQuizzes.length} 
          icon={<CheckCircle2 className="w-6 h-6" />} 
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatisticCard 
          title="Average Score" 
          value={`${avgScore}%`} 
          icon={<Target className="w-6 h-6" />} 
          colorClass="bg-green-100 text-green-600"
          trend={avgScore > 0 ? { value: 5, label: "from last week", isPositive: true } : undefined}
        />
        <StatisticCard 
          title="Study Streak" 
          value="3 Days" 
          icon={<Flame className="w-6 h-6" />} 
          colorClass="bg-orange-100 text-orange-600"
        />
        <StatisticCard 
          title="Questions Answered" 
          value={completedQuizzes.reduce((acc, h) => acc + h.answers.length, 0)} 
          icon={<Activity className="w-6 h-6" />} 
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Continue Learning */}
          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-4">Continue Learning</h2>
            {unfinishedAttempt ? (
              <Card className="border-primary-200 bg-primary-50/30 shadow-sm overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shrink-0">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-surface-900 text-lg">In Progress: {unfinishedAttempt.quiz?.title || "Practice Quiz"}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-xs font-semibold text-surface-500">45%</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" className="shrink-0 w-full sm:w-auto shadow-sm" onClick={() => navigate(`/subjects/${subjectId}/quizzes/play/${unfinishedAttempt.id}`)}>
                    Resume Quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-surface-200 border-dashed bg-transparent shadow-none">
                <CardContent className="p-6 text-center text-surface-500 flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 text-surface-300 mb-2" />
                  <p>You're all caught up! Start a new quiz to continue learning.</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Action Cards */}
          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-4">Recommended Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div whileHover={{ y: -4 }}>
                <Card className="h-full border-blue-200 hover:shadow-lg transition-shadow cursor-pointer bg-blue-50/30" onClick={() => navigate(`/subjects/${subjectId}/quizzes/create?mode=adaptive`)}>
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-surface-900 mb-1">Adaptive Quiz</h3>
                    <p className="text-xs text-surface-500 leading-relaxed">Generate personalized questions based on your weak topics.</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ y: -4 }}>
                <Card className="h-full border-primary-200 hover:shadow-lg transition-shadow cursor-pointer bg-primary-50/30" onClick={() => navigate(`/subjects/${subjectId}/quizzes/create`)}>
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-surface-900 mb-1">From Document</h3>
                    <p className="text-xs text-surface-500 leading-relaxed">Generate targeted questions from your uploaded study materials.</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div whileHover={{ y: -4 }}>
                <Card className="h-full border-orange-200 hover:shadow-lg transition-shadow cursor-pointer bg-orange-50/30" onClick={() => navigate(`/subjects/${subjectId}/quizzes/create?mode=challenge`)}>
                  <CardContent className="p-5">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                      <Flame className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-surface-900 mb-1">Weak Topic Challenge</h3>
                    <p className="text-xs text-surface-500 leading-relaxed">Practice only the concepts where your mastery is currently lowest.</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Recent Documents Quick Actions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900">Study Materials</h2>
              <Button variant="outline" size="sm" onClick={() => navigate(`/subjects/${subjectId}/documents`)} rightIcon={<ChevronRight size={14} />}>View All</Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map(doc => {
                  const isProcessing = ['PENDING', 'PROCESSING', 'TUTOR_READY', 'EXTRACTING_TOPICS', 'GENERATING_QUESTIONS'].includes(doc.status);
                  const isFailed = doc.status === 'FAILED';
                  const isReady = doc.quiz_ready;

                  return (
                    <Card key={doc.id} className="border-surface-200 hover:border-surface-300 transition-colors group">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            isReady ? 'bg-surface-100 text-surface-600' :
                            isFailed ? 'bg-red-50 text-red-600' :
                            'bg-primary-50 text-primary-600'
                          }`}>
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-warning-500" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-surface-900">{doc.title}</h4>
                            <p className="text-xs text-surface-500 mt-0.5">
                              {isReady ? 'Ready for AI Q&A and Quizzes' :
                               isFailed ? 'Processing failed' :
                               'Processing document...'}
                            </p>
                          </div>
                        </div>
                        {isReady ? (
                          <Button size="sm" variant="outline" onClick={() => {
                            console.log("Navigating to quiz creation\nsubjectId:", subjectId);
                            navigate(`/subjects/${subjectId}/quizzes/create?doc=${doc.id}`);
                          }}>
                            Create Quiz
                          </Button>
                        ) : isFailed ? (
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleRetry(doc.id)}>
                            Retry
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState 
                icon={<FileUp size={32} />}
                title="No Study Materials"
                description="Upload your notes or slides to generate customized quizzes instantly."
                actionLabel="Upload Document"
                onAction={() => navigate(`/subjects/${subjectId}/documents`)}
              />
            )}
          </section>

        </div>
        
        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* AI Insights Card */}
          <Card className="border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-card overflow-hidden relative">
            {/* Clean background */}
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-accent-400" />
                <h3 className="font-bold text-lg">AI Insights</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold mb-1">Strongest Concept</p>
                  <p className="text-sm font-medium text-green-300 flex items-center gap-2">
                    Memory Management <span className="text-xs px-2 py-0.5 bg-green-500/20 rounded-full">92% Mastery</span>
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold mb-1">Needs Improvement</p>
                  <p className="text-sm font-medium text-red-300 flex items-center gap-2">
                    Deadlocks & Semaphores <span className="text-xs px-2 py-0.5 bg-red-500/20 rounded-full">45% Mastery</span>
                  </p>
                </div>
                
                <div className="pt-4 border-t border-white/10 mt-4">
                  <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold mb-2">Recommendation</p>
                  <Button variant="primary" className="w-full bg-accent-500 hover:bg-accent-600 border-none text-white shadow-glow-accent">
                    Practice Deadlocks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-surface-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-surface-900">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="text-xs px-2" onClick={() => navigate('/quizzes/history')}>History</Button>
              </div>
              
              <div className="space-y-4">
                {completedQuizzes.slice(0, 4).map(attempt => (
                  <div key={attempt.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-surface-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate">
                        {attempt.quiz?.title || "Practice Quiz"}
                      </p>
                      <p className="text-xs text-surface-500">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-sm font-bold ${attempt.score >= 80 ? 'text-green-600' : attempt.score >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                      {attempt.score}%
                    </div>
                  </div>
                ))}
                
                {completedQuizzes.length === 0 && (
                  <p className="text-sm text-surface-500 text-center py-4">No completed quizzes yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
