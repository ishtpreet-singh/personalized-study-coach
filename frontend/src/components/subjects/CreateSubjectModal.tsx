import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, Calendar as CalendarIcon, Palette } from 'lucide-react';
import { Button } from '../ui/Button';
import { subjectsApi } from '../../api/subjects';
import type { SubjectCreate } from '../../types/subject';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COLORS = [
  { name: 'Indigo', value: 'indigo' },
  { name: 'Rose', value: 'rose' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Amber', value: 'amber' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' }
];

const ICONS = [
  '📘', '📗', '📙', '📓', '📚', '📝', '💻', '⌨️', 
  '🔬', '🧪', '⚛️', '🧬', '🌍', '🧭', '📐', '📊', 
  '📈', '🎨', '🎵', '🧠', '💡', '🎓', '🏛️', '⚖️',
  '⚕️', '🧩', '🚀', '🤖', '📸', '🎭'
];

export function CreateSubjectModal({ isOpen, onClose, onSuccess }: CreateSubjectModalProps) {
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('📘');
  const [examDate, setExamDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      const payload: SubjectCreate = {
        name,
        semester: semester || undefined,
        color,
        icon,
        exam_date: examDate ? new Date(examDate).toISOString() : undefined,
      };
      
      const newSubject = await subjectsApi.createSubject(payload);
      toast.success('Subject created successfully!');
      onSuccess();
      onClose();
      // Reset
      setName('');
      setSemester('');
      setColor('indigo');
      setIcon('📘');
      setExamDate('');
      
      // Navigate to the newly created subject workspace
      navigate(`/subjects/${newSubject.id}`);
    } catch (error) {
      console.error("Failed to create subject", error);
      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const message = data?.detail || data?.message || "An error occurred";
        
        switch (status) {
          case 400:
            toast.error(`Invalid request: ${message}`);
            break;
          case 401:
            toast.error('Session expired. Please log in again.');
            break;
          case 403:
            toast.error(`Forbidden: ${message}`);
            break;
          case 404:
            toast.error(`Not found: ${message}`);
            break;
          case 409:
            toast.error(`Conflict: ${message}`);
            break;
          case 422:
            toast.error('Validation error. Please check your inputs.');
            break;
          case 500:
            toast.error('Server error. Please try again later.');
            break;
          default:
            toast.error(`Error ${status}: ${message}`);
        }
      } else {
        toast.error('Network error or server is unreachable.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden relative z-50 flex flex-col"
          >
            <div className={`h-2 w-full bg-${color}-500 transition-colors`} />
            
            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-surface-900">Start a New Journey</h2>
              <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-600 rounded-lg transition-colors hover:bg-surface-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Subject Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Operating Systems"
                      className="w-full pl-10 pr-4 py-2 border border-surface-200 rounded-xl bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Semester (Optional)</label>
                    <input
                      type="text"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g. Fall 2026"
                      className="w-full px-4 py-2 border border-surface-200 rounded-xl bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Exam Date (Optional)</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-xl bg-surface-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Personalize
                  </label>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map(i => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIcon(i)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all",
                            icon === i ? "bg-primary-100 ring-2 ring-primary-500" : "bg-surface-50 hover:bg-surface-100 border border-surface-200"
                          )}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setColor(c.value)}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            `bg-${c.value}-500 hover:bg-${c.value}-600`,
                            color === c.value ? "ring-2 ring-offset-2 ring-surface-900 scale-110" : ""
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-surface-100 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" isLoading={isLoading}>Create Subject</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
