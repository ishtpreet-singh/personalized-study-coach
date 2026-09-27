import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, ChevronDown, ChevronUp, BrainCircuit, RefreshCw, BookOpen, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

import { quizzesApi } from "../../api/quizzes";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function QuizResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { subjectId } = useOutletContext<{ subject: any, subjectId: string }>();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const data = await quizzesApi.getAttempt(attemptId!);
      setAttempt(data);
    } catch (error) {
      console.error("Failed to load result", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-surface-500 font-medium">Analyzing your results...</p>
      </div>
    );
  }

  const { quiz, score, time_taken_seconds, answers } = attempt;
  const correctCount = answers.filter((a: any) => a.is_correct).length;
  const incorrectCount = answers.length - correctCount;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Group by topic for Radar Chart
  const topicStats: Record<string, { total: number, correct: number }> = {};
  answers.map((a: any) => a.question).forEach((q: any) => {
    const topic = q.topic || "General";
    if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
    topicStats[topic].total += 1;
    
    const ans = answers.find((a: any) => a.question_id === q.id);
    if (ans && ans.is_correct) {
      topicStats[topic].correct += 1;
    }
  });

  const radarData = Object.entries(topicStats).map(([topic, stats]) => ({
    topic: topic.length > 15 ? topic.substring(0, 15) + "..." : topic,
    score: Math.round((stats.correct / stats.total) * 100),
    fullMark: 100
  }));

  // Find strengths and weaknesses
  let strongestTopic = { topic: "-", score: 0 };
  let weakestTopic = { topic: "-", score: 100 };
  
  if (radarData.length > 0) {
    strongestTopic = radarData.reduce((prev, curr) => prev.score > curr.score ? prev : curr);
    weakestTopic = radarData.reduce((prev, curr) => prev.score < curr.score ? prev : curr);
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-fade-in">
      <button 
        onClick={() => navigate(`/subjects/${subjectId}/quizzes`)}
        className="flex items-center text-surface-500 hover:text-surface-900 transition-colors font-medium text-sm"
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Dashboard
      </button>

      {/* Hero Scoreboard */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-surface-200 text-center relative overflow-hidden">
        {/* Clean background */}
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-display font-bold text-surface-900 mb-2">
            {score >= 80 ? "🎉 Great Job!" : score >= 50 ? "👍 Good Effort!" : "💪 Keep Practicing!"}
          </h1>
          <p className="text-surface-500 mb-8 max-w-md mx-auto">You've completed the "{quiz.title}" quiz. Here is a detailed breakdown of your performance.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-display font-bold text-primary-600 mb-1">{score}%</div>
              <p className="text-sm font-semibold text-surface-400 uppercase tracking-widest">Score</p>
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-surface-200"></div>
            
            <div className="flex flex-col items-center">
              <div className="text-3xl font-display font-bold text-surface-800 mb-1">{formatTime(time_taken_seconds || 0)}</div>
              <p className="text-sm font-semibold text-surface-400 uppercase tracking-widest">Time Taken</p>
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-surface-200"></div>
            
            <div className="flex flex-col items-center">
              <div className="text-3xl font-display font-bold text-green-500 mb-1">{correctCount}</div>
              <p className="text-sm font-semibold text-surface-400 uppercase tracking-widest">Correct</p>
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-surface-200"></div>
            
            <div className="flex flex-col items-center">
              <div className="text-3xl font-display font-bold text-red-500 mb-1">{incorrectCount}</div>
              <p className="text-sm font-semibold text-surface-400 uppercase tracking-widest">Incorrect</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Charts */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-surface-200 h-96">
            <CardContent className="p-6 h-full flex flex-col">
              <h3 className="font-bold text-surface-900 mb-4">Topic Mastery</h3>
              <div className="flex-1 w-full min-h-0">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-surface-400">Not enough topic data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <Card className="border-none bg-gradient-to-br from-surface-900 to-surface-800 text-white shadow-xl overflow-hidden">
            <CardContent className="p-6 relative">
              {/* Clean background */}
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="w-5 h-5 text-accent-400" />
                <h3 className="font-bold text-lg">AI Analysis</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold mb-1">Strongest Topic</p>
                  <p className="text-sm font-medium text-green-300">{strongestTopic.topic}</p>
                </div>
                
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold mb-1">Needs Improvement</p>
                  <p className="text-sm font-medium text-red-300">{weakestTopic.topic}</p>
                </div>
                
                <div className="pt-4 border-t border-white/10 mt-4 space-y-3">
                  <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold mb-2">Recommended Next Actions</p>
                  
                  <Button variant="primary" className="w-full bg-accent-500 hover:bg-accent-600 border-none text-white shadow-glow-accent justify-start" leftIcon={<Flame size={16}/>}>
                    Practice Weak Topics
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 justify-start" leftIcon={<BookOpen size={16}/>}>
                    Review Study Material
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 justify-start" leftIcon={<RefreshCw size={16}/>} onClick={() => navigate(`/subjects/${subjectId}/quizzes/create`)}>
                    Retake Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Review Section */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold text-surface-900 mb-6">Detailed Review</h2>
        
        <div className="space-y-4">
          {answers.map((a: any) => a.question).map((q: any, idx: number) => {
            const answer = answers.find((a: any) => a.question_id === q.id);
            const isCorrect = answer?.is_correct;
            const isExpanded = expandedQ === q.id;
            
            return (
              <Card 
                key={q.id} 
                className={`border overflow-hidden transition-colors ${
                  isCorrect ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div 
                  className={`p-4 sm:p-6 flex items-start sm:items-center justify-between cursor-pointer ${
                    isCorrect ? 'bg-green-50/30 hover:bg-green-50' : 'bg-red-50/30 hover:bg-red-50'
                  }`}
                  onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    <div className="flex-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Question {idx + 1}</span>
                        {q.topic && <Badge variant="outline" className="text-[10px] py-0">{q.topic}</Badge>}
                      </div>
                      <h4 className="font-medium text-surface-900 line-clamp-2">{q.question_text}</h4>
                    </div>
                  </div>
                  <div className="shrink-0 text-surface-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-surface-200"
                    >
                      <div className="p-6 bg-white space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Your Answer</p>
                            <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                              {answer?.user_answer || <span className="italic text-surface-400">Skipped</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Correct Answer</p>
                            <div className="p-4 rounded-xl border bg-green-50 border-green-200 text-green-900">
                              {q.correct_answer}
                            </div>
                          </div>
                        </div>
                        
                        {q.explanation && (
                          <div className="bg-surface-50 p-5 rounded-xl border border-surface-200">
                            <div className="flex items-center gap-2 mb-2 text-primary-600">
                              <BrainCircuit size={18} />
                              <span className="font-bold text-sm">AI Explanation</span>
                            </div>
                            <p className="text-surface-700 text-sm leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
