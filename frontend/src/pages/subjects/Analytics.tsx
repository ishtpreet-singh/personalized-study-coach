import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import type { Subject } from '../../types/subject';
import { BarChart3, TrendingUp, Clock, Target, Calendar } from 'lucide-react';
import { analyticsApi, type AnalyticsInsights } from '../../api/analytics';

export default function Analytics() {
  const { subject, subjectId } = useOutletContext<{ subject: Subject, subjectId: string }>();
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getInsights(subjectId)
      .then(setInsights)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [subjectId]);

  if (isLoading) {
    return (
      <div className="h-full w-full p-8 flex justify-center items-center">
        <div className="animate-pulse space-y-4 text-center">
          <BarChart3 className="w-8 h-8 text-surface-300 mx-auto" />
          <p className="text-surface-500">Compiling your analytics...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return <div className="p-8">No analytics data found.</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 space-y-8 w-full pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${subject.color || 'primary'}-100 flex items-center justify-center text-${subject.color || 'primary'}-600`}>
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-surface-900">Learning Analytics</h2>
          <p className="text-surface-500 mt-1">Actionable insights for {subject.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Actionable Question 1 */}
        <Card className="border-surface-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Which topic is getting weaker?</h3>
                <p className="text-sm text-surface-500 mt-1">Based on your recent quiz performance</p>
              </div>
            </div>
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-100">
              <p className="text-surface-700 text-sm leading-relaxed">
                Your mastery in <strong className="text-surface-900">{insights.weakestSubject}</strong> has dropped by {insights.weakestSubjectDrop}% since last week. 
                We recommend starting a 10-question adaptive quiz focusing solely on these topics before moving on to new material.
              </p>
              <button className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Start Adaptive Quiz →
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Question 2 */}
        <Card className="border-surface-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Which topic is improving?</h3>
                <p className="text-sm text-surface-500 mt-1">Tracking your learning velocity</p>
              </div>
            </div>
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-100">
              <p className="text-surface-700 text-sm leading-relaxed">
                Excellent! Your accuracy in <strong className="text-surface-900">{insights.improvingTopic}</strong> has increased by <strong className="text-surface-900">{insights.improvingTopicIncrease}%</strong> over the last 14 days. 
                You are answering questions faster, indicating deep understanding.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Question 3 */}
        <Card className="border-surface-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">When should I revise?</h3>
                <p className="text-sm text-surface-500 mt-1">Spaced repetition schedule</p>
              </div>
            </div>
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-100 space-y-3">
              {insights.schedule.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-surface-900">{item.topic}</span>
                  <span className="text-surface-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {item.dueInDays === 0 ? 'Due Today' : `In ${item.dueInDays} Days`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
