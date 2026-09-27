import { useState, useEffect } from 'react';
import { Outlet, useParams, NavLink } from 'react-router-dom';
import { Bot, FileText, CheckSquare, BrainCircuit, BarChart3, ChevronLeft, Settings, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { subjectsApi } from '../../api/subjects';
import type { Subject } from '../../types/subject';
import { formatDistanceToNow } from 'date-fns';
import { EditSubjectModal } from '../../components/subjects/EditSubjectModal';
import { DeleteConfirmDialog } from '../../components/ui/DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { label: 'AI Tutor', icon: Bot, path: 'tutor' },
  { label: 'Documents', icon: FileText, path: 'documents' },
  { label: 'Quizzes', icon: CheckSquare, path: 'quizzes' },
  { label: 'Learning Profile', icon: BrainCircuit, path: 'profile' },
  { label: 'Analytics', icon: BarChart3, path: 'analytics' },
  { label: 'Study Planner', icon: Calendar, path: '/planner', comingSoon: true },
];

export default function SubjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchSubject = async () => {
    if (!id) return;
    try {
      const data = await subjectsApi.getSubject(id);
      setSubject(data);
    } catch (error) {
      console.error("Failed to fetch subject", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  const handleDeleteSubject = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await subjectsApi.deleteSubject(id);
      toast.success("Subject deleted successfully");
      setIsDeleteModalOpen(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete subject", error);
      toast.error("Failed to delete subject");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-surface-50/50 p-8">
        <div className="w-64 h-8 bg-surface-200 rounded animate-pulse mb-4" />
        <div className="w-32 h-4 bg-surface-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-xl font-bold text-surface-900 mb-2">Subject not found</h2>
        <p className="text-surface-500">This subject may have been deleted or does not exist.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-50/50">
      <EditSubjectModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchSubject}
        onDeleteRequest={() => {
          setIsEditModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
        subject={subject}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? All documents, quizzes, and learning progress will be permanently lost."
        isLoading={isDeleting}
      />

      {/* Subject Header */}
      <header className="px-8 py-6 bg-white border-b border-surface-200 shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <NavLink
            to="/dashboard"
            className="p-2 -ml-2 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </NavLink>
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-900 tracking-tight flex items-center gap-2">
              {subject.icon} {subject.name}
            </h1>
            <p className="text-sm text-surface-500">
              Last studied {formatDistanceToNow(new Date(subject.updated_at), { addSuffix: true })}
            </p>
          </div>
          
          <div className="ml-auto flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full border-4 border-${subject.color || 'primary'}-100 flex items-center justify-center relative`}>
                 <span className={`text-xs font-bold text-${subject.color || 'primary'}-700`}>72%</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-surface-900">Mastery</p>
                <p className="text-xs text-surface-500">Needs review</p>
              </div>
            </div>
            <div className="h-8 w-px bg-surface-200" />
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-surface-500 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1 -mb-6">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative",
                isActive && !tab.comingSoon
                  ? `border-${subject.color || 'primary'}-600 text-${subject.color || 'primary'}-700`
                  : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.comingSoon && (
                <span className="ml-1 text-[9px] uppercase tracking-wider font-bold bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-sm">
                  Soon
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto relative">
        <Outlet context={{ subject, subjectId: id }} />
      </main>
    </div>
  );
}
