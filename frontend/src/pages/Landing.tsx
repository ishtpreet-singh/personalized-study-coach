import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Bot, FileText, BrainCircuit, Calendar } from 'lucide-react';

const FEATURES = [
  { icon: FileText, title: 'Smart Uploads', description: 'Upload PDFs, PPTs, or handwritten notes. We instantly digitize and analyze them.' },
  { icon: Bot, title: 'AI Tutor Q&A', description: 'Chat with your notes. Get instant, accurate answers backed by your own materials.' },
  { icon: BrainCircuit, title: 'Adaptive Quizzes', description: 'Auto-generated quizzes that adapt to your knowledge gaps and mastery level.' },
  { icon: Calendar, title: 'Study Scheduling', description: 'Sync with Google Calendar for personalized, optimized revision schedules.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🎓</span>
          </div>
          <span className="font-display font-bold text-xl text-surface-900 tracking-tight">Study Coach</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">
            Sign In
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-5xl md:text-7xl font-bold tracking-tight text-surface-900 mb-6"
            >
              Master any subject with your personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">AI Tutor</span>.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-surface-600 mb-10 max-w-2xl mx-auto"
            >
              Upload your lecture notes, slides, and textbooks. We automatically generate quizzes, identify your weak spots, and build your perfect study schedule.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center gap-4"
            >
              <Link to="/register">
                <Button size="lg" className="rounded-full px-8">Start Learning for Free</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8">See Demo</Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 bg-white border-t border-surface-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl font-bold text-surface-900 mb-4">Everything you need to ace your exams</h2>
              <p className="text-surface-600 max-w-2xl mx-auto">Our AI analyzes your materials to create a highly personalized, efficient study pipeline.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feat, i) => (
                <motion.div 
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-surface-50 border border-surface-100 hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-12 h-12 bg-white rounded-xl border border-surface-200 flex items-center justify-center mb-4 text-primary-600">
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-surface-900 mb-2">{feat.title}</h3>
                  <p className="text-surface-600 text-sm leading-relaxed">{feat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
