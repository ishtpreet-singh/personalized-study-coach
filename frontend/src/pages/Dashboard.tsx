import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Bot, Calendar, Upload, FileQuestion, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../api/dashboard';
import type { DashboardData } from '../api/dashboard';
import { CreateSubjectModal } from '../components/subjects/CreateSubjectModal';
import { StatRing } from '../components/dashboard/StatRing';
import { cn } from '../utils/cn';

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'mastery'>('name');

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardApi.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const hour = new Date().getHours();
  let greeting = 'Good Night';
  let emoji = '🌙';
  if (hour >= 5 && hour < 12) { greeting = 'Good Morning'; emoji = '👋'; }
  else if (hour >= 12 && hour < 17) { greeting = 'Good Afternoon'; emoji = '👋'; }
  else if (hour >= 17 && hour < 21) { greeting = 'Good Evening'; emoji = '👋'; }

  const filteredAndSortedSubjects = dashboardData?.subjects
    .filter(s => s.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'mastery') return b.stats.mastery - a.stats.mastery;
      if (sortBy === 'recent') {
        const timeA = a.stats.last_studied_at ? new Date(a.stats.last_studied_at).getTime() : 0;
        const timeB = b.stats.last_studied_at ? new Date(b.stats.last_studied_at).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    }) || [];

  return (
    <div className="w-full space-y-10 pb-12">
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      
      {/* 1. Top Header Hero */}
      {isLoading || !dashboardData ? (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-pulse">
          <div className="flex-1 space-y-4">
            <div className="w-1/4 h-8 bg-slate-200 rounded-full"></div>
            <div className="w-3/4 h-12 bg-slate-200 rounded"></div>
            <div className="w-1/2 h-6 bg-slate-200 rounded"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-32 h-24 bg-slate-200 rounded-2xl"></div>
            <div className="w-36 h-24 bg-slate-200 rounded-2xl"></div>
            <div className="w-48 h-24 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      ) : (
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-700 text-sm font-semibold border border-slate-200 mb-6 shadow-sm">
            🎯 Today's Goal: {dashboardData.todayGoal}
          </div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight flex items-center gap-3 leading-tight">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Student'} {emoji}
          </h1>
          <p className="text-slate-500 mt-4 text-lg">Let's make today productive. You have a {dashboardData.study_streak}-day study streak 🔥</p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <Card className="p-5 flex flex-col gap-1.5 flex-1 lg:w-32">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-4 h-4"/> Est. Time</span>
            <span className="text-2xl font-bold text-slate-900">{dashboardData.estimatedStudyTimeMins} <span className="text-base font-medium text-slate-500">min</span></span>
          </Card>
          
          <Card className="p-5 flex flex-col gap-1.5 flex-1 lg:w-40">
            <span className="text-xs font-semibold text-orange-600/80 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Next Up</span>
            <span className="text-2xl font-bold text-slate-900">{dashboardData.nextRevision}</span>
          </Card>

          <Card className="p-5 flex items-center gap-5 col-span-2 md:col-span-1 lg:w-auto">
            <StatRing percentage={dashboardData.overallMastery} size={56} strokeWidth={5} color="text-primary-600" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall</span>
              <span className="text-2xl font-bold text-slate-900 leading-tight">Mastery</span>
            </div>
          </Card>
        </div>
      </header>
      )}

      {/* 2. Subjects Grid (Highest Priority) */}
      <section className="space-y-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Your Subjects</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search subjects..." 
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full md:w-56 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm transition-all cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Sort by Name</option>
              <option value="recent">Recently Studied</option>
              <option value="mastery">Mastery Score</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="h-[220px] animate-pulse" />
            ))
          ) : (
            <>
              {filteredAndSortedSubjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Link to={`/subjects/${subject.id}`} className="block h-full">
                    <Card className="h-full group flex flex-col relative overflow-hidden">
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6 relative">
                          <div className="flex items-center gap-4 pr-16">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-2xl shadow-sm group-hover:scale-105 transition-transform shrink-0">
                              {subject.icon || '📘'}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2" title={subject.name}>
                                {subject.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 font-medium">
                                Last studied: {subject.stats.last_studied_at ? new Date(subject.stats.last_studied_at).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="absolute top-0 right-0">
                            <StatRing 
                              percentage={subject.stats.mastery}
                              size={48} 
                              strokeWidth={4} 
                              color={subject.stats.mastery > 70 ? "text-emerald-500" : "text-primary-600"} 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                            <span className="block text-xl font-bold text-slate-800">{subject.stats.document_count}</span>
                            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Docs</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                            <span className="block text-xl font-bold text-slate-800">{subject.stats.quiz_count}</span>
                            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Quizzes</span>
                          </div>
                          <div className="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
                            <span className="block text-xl font-bold text-red-600">{subject.stats.weak_topic_count}</span>
                            <span className="block text-[10px] font-semibold text-red-500 uppercase tracking-wider mt-1">Weak</span>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="w-full bg-primary-600 text-white rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm shadow-sm group-hover:bg-primary-700 transition-colors">
                            Continue Learning <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -4 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="h-full"
              >
                <Card className="h-full border-dashed border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer group flex items-center justify-center min-h-[220px]">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-100 group-hover:border-primary-200 transition-colors mb-3">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">Create New Subject</h3>
                    <p className="text-sm text-slate-500 mt-1.5">Start a new learning journey</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* 3. Dashboard Widgets (Today's Plan, Quick Actions, Upcoming) */}
      <section className="pt-6">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Today's Plan */}
          <Card className="flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Today's Plan</h3>
              <div className="space-y-3 flex-1">
                {isLoading || !dashboardData ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-8 bg-slate-50 rounded-md animate-pulse" />
                    ))}
                  </div>
                ) : dashboardData.plan.length > 0 ? (
                  dashboardData.plan.slice(0, 3).map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-slate-900 truncate">
                          {item.label} <span className="text-slate-500 font-normal">{item.subject ? `(${item.subject})` : ''}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-base text-slate-500 text-center py-2">No plan for today.</div>
                )}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link to="/dashboard" className="text-base font-medium text-primary-600 flex items-center gap-1.5 hover:gap-2 transition-all">
                  View Full Plan <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3 flex-1">
                {[
                  { label: "AI Tutor", icon: Bot, color: "text-primary-600", bg: "bg-primary-50" },
                  { label: "Calendar", icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Upload", icon: Upload, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Quiz", icon: FileQuestion, color: "text-rose-600", bg: "bg-rose-50" }
                ].map((action, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", action.bg, action.color)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Upcoming</h3>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-900">DBMS Quiz</p>
                    <p className="text-sm text-slate-500 mt-0.5">Tomorrow, 9:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-900">OS Revision</p>
                    <p className="text-sm text-slate-500 mt-0.5">Aug 6, 7:00 PM</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link to="/dashboard" className="text-base font-medium text-primary-600 flex items-center gap-1.5 hover:gap-2 transition-all">
                  View Calendar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* 4. Recent Activity */}
      <section className="space-y-6 pt-6">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Recent Activity</h2>
        <Card>
          <CardContent className="p-5 flex flex-col md:flex-row gap-3 min-h-[80px]">
            {isLoading || !dashboardData ? (
               <div className="w-full h-12 bg-slate-50 rounded-xl animate-pulse" />
            ) : dashboardData.recentActivity.length > 0 ? (
              <>
                {dashboardData.recentActivity.map((activity, _i) => (
                  <div key={activity.id} className="flex-1 p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-4 cursor-pointer">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      activity.type === 'mastery' ? 'bg-emerald-50 text-emerald-600' :
                      activity.type === 'quiz' ? 'bg-orange-50 text-orange-600' :
                      activity.type === 'upload' ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-600'
                    )}>
                      {activity.type === 'mastery' && <CheckCircle2 className="w-5 h-5" />}
                      {activity.type === 'quiz' && <FileQuestion className="w-5 h-5" />}
                      {activity.type === 'upload' && <Upload className="w-5 h-5" />}
                      {activity.type === 'study' && <BookOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-base font-medium text-slate-900">{activity.title}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {activity.context} • {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex-1 p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer relative">
                  <Link to="/dashboard" className="text-base font-medium text-primary-600 flex items-center gap-1.5 hover:underline">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="w-full p-4 text-center text-base text-slate-500">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
