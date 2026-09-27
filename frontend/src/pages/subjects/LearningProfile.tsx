import { useOutletContext, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import type { Subject, AILearningProfile } from '../../types/subject';
import { BrainCircuit, Star, AlertTriangle, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { subjectsApi } from '../../api/subjects';
import { EmptyState } from '../../components/quiz/EmptyState';

export default function LearningProfile() {
  const { subject } = useOutletContext<{ subject: Subject }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AILearningProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    subjectsApi.getLearningProfile(subject.id)
      .then(setProfile)
      .catch((err) => {
        if (err.response?.status !== 404) {
          console.error("Failed to fetch learning profile:", err);
        }
        setProfile(null);
      })
      .finally(() => setIsLoading(false));
  }, [subject.id]);

  if (isLoading) {
    return (
      <div className="h-full w-full p-8 flex justify-center items-center">
        <div className="animate-pulse space-y-4 text-center">
          <BrainCircuit className="w-8 h-8 text-surface-300 mx-auto" />
          <p className="text-surface-500">Analyzing your learning patterns...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full w-full p-6 md:p-8 animate-fade-in flex flex-col justify-center max-w-3xl mx-auto">
        <EmptyState
          icon={<BrainCircuit className="w-12 h-12" />}
          title="No Learning Data Yet"
          description={`Your AI Learning Profile for ${subject.name} will be generated once you start taking quizzes. It will map your cognitive mastery, identify weak spots, and recommend personalized study plans.`}
          actionLabel="Start a Quiz Now"
          onAction={() => navigate(`/subjects/${subject.id}/quizzes`)}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 space-y-8 w-full pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${subject.color || 'primary'}-100 flex items-center justify-center text-${subject.color || 'primary'}-600`}>
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900">AI Learning Profile</h2>
          <p className="text-surface-500 mt-1">A detailed map of your cognitive mastery for {subject.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Metrics & Next Action */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-surface-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Overall Mastery
              </h3>
              
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-surface-100" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="currentColor" strokeWidth="8" fill="none" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 * (1 - 72 / 100)} 
                    className={`text-${subject.color || 'primary'}-500 transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-surface-900 tracking-tight">72<span className="text-xl text-surface-400">%</span></span>
                  <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-1">Advanced</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Student Confidence</span>
                  <span className="font-semibold text-surface-900">High (85%)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-surface-500">Quiz Accuracy</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> 78% Avg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-50 border-primary-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary-600" />
                Recommended Next Action
              </h3>
              <p className="text-sm text-primary-800 mb-4 leading-relaxed">
                Take a 10-question quiz specifically targeting "Deadlocks" to patch your weakest knowledge area before the exam.
              </p>
              <button className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                Start Focused Quiz
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Map (Detailed List) */}
        <div className="md:col-span-2 space-y-6">
          
          <Card className="border-surface-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-surface-500" />
                AI Learning Insights
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed">
                You have made rapid progress in <span className="font-bold text-emerald-600">Memory Management</span> over the last week. 
                However, your quiz accuracy drops significantly when tested on <span className="font-bold text-orange-600">Concurrency</span> topics. 
                I suggest we spend the next 2 study sessions reviewing OS Scheduling algorithms.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
                <Star className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <h3 className="font-bold text-surface-900 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-600" />
                  Strong Topics
                </h3>
                
                <div className="space-y-4 mt-6">
                  {[
                    { name: "Memory Management", score: 92 },
                    { name: "Process Scheduling", score: 88 },
                    { name: "Virtual Memory", score: 85 }
                  ].map((topic, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-surface-900">{topic.name}</span>
                        <span className="font-bold text-green-600">{topic.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-green-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600">
                <AlertTriangle className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <h3 className="font-bold text-surface-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Weak Topics
                </h3>
                
                <div className="space-y-4 mt-6">
                  {[
                    { name: "Deadlocks", score: 45 },
                    { name: "File Systems", score: 52 },
                  ].map((topic, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-surface-900">{topic.name}</span>
                        <span className="font-bold text-red-600">{topic.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${topic.score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-red-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
