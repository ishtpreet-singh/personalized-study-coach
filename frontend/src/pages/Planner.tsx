import { useState, useEffect } from 'react';
import { CheckSquare, BrainCircuit, Sparkles, Loader2, PlayCircle, BookOpen } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { plannerApi, type StudyPlan } from '../api/planner';

export default function Planner() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    plannerApi.generatePlan()
      .then(setPlan)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-600" />
            AI Study Planner
          </h1>
          <p className="text-surface-500 mt-1">Your intelligently generated study plan for today.</p>
        </div>
      </header>

      {isLoading ? (
        <Card className="bg-white border-surface-200 shadow-sm">
          <CardContent className="p-12 flex flex-col items-center justify-center text-surface-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-medium">Generating your personalized study plan...</p>
          </CardContent>
        </Card>
      ) : plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-surface-900">Today's Schedule ({plan.totalDurationMins} mins)</h2>
            <div className="space-y-4">
              {plan.items.map((item: any, i: number) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-surface-200 hover:border-primary-200 transition-colors">
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                          ${item.type === 'review' ? 'bg-emerald-50 text-emerald-600' :
                            item.type === 'practice' ? 'bg-orange-50 text-orange-600' :
                            'bg-primary-50 text-primary-600'
                          }
                        `}>
                          {item.type === 'review' ? <BrainCircuit className="w-6 h-6" /> :
                           item.type === 'practice' ? <CheckSquare className="w-6 h-6" /> :
                           <BookOpen className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-surface-900 text-lg">{item.topic}</h3>
                          <p className="text-sm text-surface-500 uppercase tracking-wider font-semibold mt-1">
                            {item.type} • {item.durationMins} mins
                          </p>
                        </div>
                      </div>
                      <button className="p-3 text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                        <PlayCircle className="w-8 h-8" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="border-surface-200 bg-surface-50/50">
              <CardContent className="p-6">
                <h3 className="font-bold text-surface-900 mb-4">Why this plan?</h3>
                <p className="text-sm text-surface-600 leading-relaxed">
                  Based on your recent quiz performance and spaced repetition schedule, we've prioritized <strong>Deadlocks</strong> for review today to prevent knowledge decay. <strong>Memory Layout</strong> was added as practice since you haven't been tested on it in 5 days.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="bg-white border-surface-200 shadow-sm">
          <CardContent className="p-12 text-center text-surface-500">
            Failed to load study plan.
          </CardContent>
        </Card>
      )}

    </div>
  );
}
