import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Target, Calendar, Trash2, RotateCw, Play, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

import { quizzesApi } from "../../api/quizzes";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/quiz/EmptyState";

export default function QuizHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await quizzesApi.getAttempts(0, 50);
      setHistory(data.items);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attemptId: string) => {
    if (!confirm("Are you sure you want to delete this attempt record?")) return;
    try {
      // Assuming a delete API exists or could be added. For now just optimistic UI update.
      // await quizzesApi.deleteAttempt(attemptId);
      setHistory(prev => prev.filter(h => h.id !== attemptId));
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filteredHistory = history
    .filter(h => filterMode === "ALL" || h.mode === filterMode)
    .filter(h => h.quiz?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "DATE_DESC") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "DATE_ASC") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "SCORE_DESC") return (b.score || 0) - (a.score || 0);
      if (sortBy === "SCORE_ASC") return (a.score || 0) - (b.score || 0);
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-surface-500 hover:text-surface-900 transition-colors mb-6 font-medium text-sm"
      >
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Quiz History</h1>
          <p className="text-surface-600 mt-1">Review your past attempts and track your progress.</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-50 border border-surface-200 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-surface-400 mr-2" />
            <select 
              value={filterMode} 
              onChange={(e) => setFilterMode(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-surface-700 focus:outline-none appearance-none pr-4 cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="PRACTICE">Practice</option>
              <option value="EXAM">Exam</option>
              <option value="REVISION">Revision</option>
            </select>
          </div>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-2 text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="SCORE_DESC">Highest Score</option>
            <option value="SCORE_ASC">Lowest Score</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <EmptyState 
          icon={<RotateCw className="w-10 h-10" />}
          title="No history found"
          description={history.length === 0 ? "You haven't taken any quizzes yet." : "No attempts match your filters."}
          actionLabel={history.length === 0 ? "Create your first quiz" : "Clear filters"}
          onAction={() => history.length === 0 ? navigate('/dashboard') : setFilterMode("ALL")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((h, idx) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow h-full flex flex-col group border-surface-200">
                <CardContent className="p-5 flex-1 flex flex-col">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-surface-900 text-lg truncate mb-1">
                        {h.quiz?.title || "Custom Quiz"}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="capitalize text-[10px] py-0">{h.mode.toLowerCase()}</Badge>
                        {h.completed_at ? (
                          <Badge variant="success" className="text-[10px] py-0">Completed</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] py-0">In Progress</Badge>
                        )}
                      </div>
                    </div>
                    {h.completed_at && (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 ${
                        h.score >= 80 ? 'border-green-100 bg-green-50 text-green-600' :
                        h.score >= 50 ? 'border-orange-100 bg-orange-50 text-orange-600' :
                        'border-red-100 bg-red-50 text-red-600'
                      }`}>
                        <span className="font-bold text-lg">{h.score}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-surface-600 mt-auto bg-surface-50 p-3 rounded-xl border border-surface-100 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-surface-400" />
                      <span>{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-surface-400" />
                      <span>{formatTime(h.time_taken_seconds)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Target className="w-4 h-4 text-surface-400" />
                      <span className="truncate">
                        {h.answers?.length || 0} / {h.quiz?.total_questions || 0} Questions Answered
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    {h.completed_at ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mr-2"
                          onClick={() => navigate(`/subjects/${h.quiz?.subject_id}/quizzes/result/${h.id}`)}
                          leftIcon={<Target size={16}/>}
                        >
                          Review
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-surface-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(h.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/subjects/${h.quiz?.subject_id}/quizzes/play/${h.id}`)}
                        leftIcon={<Play size={16}/>}
                      >
                        Resume Quiz
                      </Button>
                    )}
                  </div>
                  
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
