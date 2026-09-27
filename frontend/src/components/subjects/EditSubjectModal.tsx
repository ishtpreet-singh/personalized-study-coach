import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { subjectsApi } from '../../api/subjects';
import type { Subject, SubjectUpdate } from '../../types/subject';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteRequest?: () => void;
  subject: Subject;
}

const COLORS = [
  { label: 'Indigo', value: '#4F46E5', bg: 'bg-indigo-600' },
  { label: 'Rose', value: '#E11D48', bg: 'bg-rose-600' },
  { label: 'Emerald', value: '#059669', bg: 'bg-emerald-600' },
  { label: 'Amber', value: '#D97706', bg: 'bg-amber-600' },
  { label: 'Sky', value: '#0284C7', bg: 'bg-sky-600' },
  { label: 'Purple', value: '#9333EA', bg: 'bg-purple-600' }
];

const ICONS = ['📘', '🧬', '📐', '💻', '🌍', '🎨', '🧠', '📊'];

export function EditSubjectModal({ isOpen, onClose, onSuccess, onDeleteRequest, subject }: EditSubjectModalProps) {
  const [name, setName] = useState(subject.name);
  const [semester, setSemester] = useState(subject.semester || '');
  const [color, setColor] = useState(subject.color);
  const [icon, setIcon] = useState(subject.icon || '📘');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(subject.name);
      setSemester(subject.semester || '');
      setColor(subject.color);
      setIcon(subject.icon || '📘');
    }
  }, [isOpen, subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: SubjectUpdate = {
        name: name.trim(),
        semester: semester.trim() || undefined,
        color,
        icon
      };

      await subjectsApi.updateSubject(subject.id, updateData);
      toast.success('Subject updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        toast.error(`Update failed: ${error.response.data.detail}`);
      } else {
        toast.error('Failed to update subject. Please try again.');
      }
      console.error("Failed to update subject:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-surface-100">
              <h2 className="text-xl font-bold text-surface-900">Edit Subject</h2>
              <button
                onClick={onClose}
                className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-surface-700 mb-1.5">
                    Subject Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-semibold text-surface-700 mb-1.5">
                    Semester / Term (Optional)
                  </label>
                  <input
                    id="semester"
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Fall 2024"
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Subject Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full ${c.bg} transition-all duration-200 flex items-center justify-center
                          ${color === c.value ? 'ring-2 ring-offset-2 ring-surface-900 scale-110' : 'hover:scale-110'}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-2">
                    Subject Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-200
                          ${icon === i ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-500' : 'bg-surface-50 hover:bg-surface-100 text-surface-600'}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
                {onDeleteRequest && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    onClick={onDeleteRequest}
                    disabled={isLoading}
                  >
                    Delete Subject
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
