import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Button } from '../components/ui/Button';
import {
  Bot, FileText, BrainCircuit, Calendar, Upload, MessageSquare,
  ShieldCheck, Mail, KeyRound, History, Sparkles, BookOpen,
  BarChart3, ClipboardList, Layers, ArrowRight, Check, X,
  ChevronDown, Zap, Target, GraduationCap, MousePointerClick
} from 'lucide-react';

/* ── Scroll-triggered fade-in wrapper ───────────────────────── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Section heading helper ─────────────────────────────────── */
function SectionHeading({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-16 max-w-3xl mx-auto">
      <FadeIn>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 mb-5">
          {badge}
        </span>
      </FadeIn>
      <FadeIn delay={0.05}>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 mb-5 tracking-tight">{title}</h2>
      </FadeIn>
      <FadeIn delay={0.1}>
        <p className="text-surface-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">{subtitle}</p>
      </FadeIn>
    </div>
  );
}

/* ── Data ────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Bot, title: 'AI Tutor', desc: 'Ask questions directly from your uploaded study materials using Retrieval-Augmented Generation (RAG).', live: true },
  { icon: FileText, title: 'Smart Document Understanding', desc: 'Upload PDFs, PPTs, and notes. AI understands your content automatically.', live: true },
  { icon: BookOpen, title: 'AI Summaries', desc: 'Generate concise revision notes from long chapters.', live: false },
  { icon: ClipboardList, title: 'Adaptive Quiz Generator', desc: 'Generate quizzes from your own notes to test comprehension.', live: false },
  { icon: Layers, title: 'Flashcards', desc: 'Create revision flashcards instantly from your study materials.', live: false },
  { icon: BarChart3, title: 'Weak Topic Analysis', desc: 'Identify concepts that require more practice and focus.', live: false },
  { icon: Calendar, title: 'Personalized Study Planner', desc: 'Generate AI-powered study schedules tailored to your deadlines.', live: false },
  { icon: Sparkles, title: 'Google Calendar Integration', desc: 'Automatically organize your study plan in Google Calendar.', live: false },
];

const STEPS = [
  { icon: Upload, title: 'Upload Study Material', desc: 'Drop your PDFs, lecture slides, or notes into Study Coach.' },
  { icon: BrainCircuit, title: 'AI Understands Your Documents', desc: 'Our AI reads, indexes, and deeply comprehends your materials.' },
  { icon: MessageSquare, title: 'Ask Questions', desc: 'Chat with your documents and get cited, accurate answers.' },
  { icon: ClipboardList, title: 'Generate Quizzes', desc: 'Test your knowledge with AI-generated quizzes from your notes.' },
  { icon: Target, title: 'Track Your Progress', desc: 'Identify weak areas and study smarter, not harder.' },
];

const AVAILABLE_TODAY = [
  { icon: Bot, label: 'AI Tutor with RAG' },
  { icon: Upload, label: 'Document Upload & Processing' },
  { icon: MessageSquare, label: 'AI Chat with Citations' },
  { icon: History, label: 'Conversation History' },
  { icon: ShieldCheck, label: 'Secure Authentication' },
  { icon: MousePointerClick, label: 'Google Sign-In' },
  { icon: Mail, label: 'Email Verification' },
  { icon: KeyRound, label: 'Password Reset' },
];

const ROADMAP = [
  { icon: ClipboardList, label: 'Adaptive Quiz Engine' },
  { icon: Layers, label: 'AI Flashcards' },
  { icon: BookOpen, label: 'AI Notes & Summaries' },
  { icon: BarChart3, label: 'Weak Topic Detection' },
  { icon: Calendar, label: 'Personalized Study Planner' },
  { icon: Sparkles, label: 'Google Calendar Integration' },
  { icon: Target, label: 'Learning Analytics Dashboard' },
];

const DIFFERENTIATORS = [
  { icon: GraduationCap, title: 'Personalized Learning', desc: 'AI learns from YOUR study material instead of generic internet content.' },
  { icon: FileText, title: 'Retrieval-Augmented Generation', desc: 'Answers are grounded in your uploaded documents with citations, not hallucinations.' },
  { icon: Zap, title: 'Modern Learning Experience', desc: 'One platform for tutoring, revision, and progress tracking—beautifully designed.' },
  { icon: Target, title: 'Future Ready', desc: 'Adaptive learning roadmap designed for long-term student success.' },
];

/* ── Component ──────────────────────────────────────────────── */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  // Show navbar CTAs once ~65% of the hero has scrolled out of view
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setPastHero(v > 0.65);
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white text-surface-900 font-sans overflow-x-hidden">

      {/* ━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-surface-200/60' : 'bg-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <span className="text-white text-base">🎓</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-surface-900">Study Coach</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors">How it Works</a>
            <a href="#roadmap" className="text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors">Roadmap</a>
            <a href="#faq" className="text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors">FAQ</a>
          </div>

          {/* Right side: trust badge ↔ CTA cross-fade */}
          <div className="relative flex items-center justify-end min-w-[260px] h-10">
            {/* Trust badge — visible while hero is on screen */}
            <motion.div
              animate={pastHero ? { opacity: 0, y: -6, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-y-0 right-0 flex items-center ${pastHero ? 'pointer-events-none' : ''}`}
            >
              <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-surface-200/60 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-surface-800 leading-tight">AI-Powered Learning</span>
                  <span className="text-[10px] text-surface-400 font-medium leading-tight">Free · No Credit Card</span>
                </div>
              </div>
            </motion.div>

            {/* CTA buttons — visible after scrolling past hero */}
            <motion.div
              animate={pastHero ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-y-0 right-0 flex items-center gap-3 ${pastHero ? '' : 'pointer-events-none'}`}
            >
              <Link to="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors hidden sm:inline-block">
                Sign In
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full px-5 shadow-md shadow-primary-500/20 hover:shadow-primary-500/40">Create Free Account</Button>
              </Link>
            </motion.div>
          </div>
        </nav>
      </header>

      <main>
        {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section ref={heroRef} className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 px-6 overflow-hidden">
          {/* Animated background gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-100/60 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-200/40 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-accent-400/10 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>

          <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-surface-900 mb-7 leading-[1.1]"
            >
              Your AI-Powered{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500">
                Personalized Study Coach
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-surface-500 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Upload your lecture notes, PDFs, presentations, and textbooks.
              Study Coach understands your materials, answers questions with citations,
              generates quizzes, creates flashcards, summarizes chapters, identifies
              weak topics, and helps you study smarter—all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/register">
                <Button size="lg" className="rounded-full px-10 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-full px-10">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 text-surface-400"
          >
            <span className="text-xs font-medium">Scroll to explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.div>
        </section>

        {/* ━━━ FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="features" className="py-24 sm:py-32 px-6 bg-surface-50/50 border-y border-surface-100">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              badge="Features"
              title="Everything you need to ace your exams"
              subtitle="From intelligent tutoring to adaptive quizzes—Study Coach provides a comprehensive AI-powered learning toolkit."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <div className="group relative bg-white rounded-2xl border border-surface-200/70 p-6 h-full hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                    {!f.live && (
                      <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                        Coming Soon
                      </span>
                    )}
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5 text-primary-600 group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-300">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-surface-900 mb-2">{f.title}</h3>
                    <p className="text-surface-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="how-it-works" className="py-24 sm:py-32 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <SectionHeading
              badge="How It Works"
              title="Start studying smarter in minutes"
              subtitle="Getting started with Study Coach is simple. Upload, ask, and learn."
            />

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary-200 via-primary-300 to-primary-100 hidden sm:block" />

              <div className="space-y-8 sm:space-y-12">
                {STEPS.map((step, i) => (
                  <FadeIn key={step.title} delay={i * 0.08}>
                    <div className="flex gap-5 sm:gap-8 items-start group">
                      <div className="relative z-10 shrink-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl border-2 border-primary-200 flex items-center justify-center text-primary-600 shadow-sm group-hover:border-primary-400 group-hover:shadow-md group-hover:shadow-primary-500/10 transition-all duration-300">
                          <step.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                      </div>
                      <div className="pt-1 sm:pt-3">
                        <span className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-1.5 block">Step {i + 1}</span>
                        <h3 className="font-semibold text-lg sm:text-xl text-surface-900 mb-1.5">{step.title}</h3>
                        <p className="text-surface-500 text-sm sm:text-base leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ WHY STUDY COACH (Comparison) ━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-24 sm:py-32 px-6 bg-surface-50/50 border-y border-surface-100">
          <div className="max-w-5xl mx-auto">
            <SectionHeading
              badge="Why Study Coach"
              title="Stop studying the hard way"
              subtitle="See how AI-powered studying compares to traditional methods."
            />

            <FadeIn>
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                {/* Traditional */}
                <div className="bg-white rounded-2xl border border-surface-200 p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-surface-200" />
                  <h3 className="font-display font-bold text-xl text-surface-400 mb-6">Traditional Studying</h3>
                  <ul className="space-y-4">
                    {[
                      'Reading hundreds of pages manually',
                      'Manual revision without structure',
                      'Static notes that never adapt',
                      'No weak-topic tracking',
                      'Random, generic quizzes',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-surface-400">
                        <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Study Coach */}
                <div className="bg-white rounded-2xl border-2 border-primary-200 p-8 relative overflow-hidden shadow-card ring-1 ring-primary-100">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
                  <h3 className="font-display font-bold text-xl text-surface-900 mb-6 flex items-center gap-2">
                    Study Coach <Sparkles className="w-5 h-5 text-primary-500" />
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'AI Tutor that understands your materials',
                      'Document-based Q&A with citations',
                      'Smart summaries & revision notes',
                      'Flashcards from your own content',
                      'Personalized quizzes & progress tracking',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-surface-800">
                        <Check className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ━━━ AVAILABLE TODAY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-24 sm:py-32 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <SectionHeading
              badge="✅ Live Now"
              title="Available today"
              subtitle="These features are production-ready and available right now in Study Coach."
            />

            <FadeIn>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {AVAILABLE_TODAY.map((item) => (
                  <div key={item.label} className="group bg-accent-500/5 border border-accent-500/15 rounded-2xl p-5 text-center hover:bg-accent-500/10 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 text-accent-500 shadow-sm group-hover:shadow-md transition-shadow">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-surface-800">{item.label}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ━━━ ROADMAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="roadmap" className="py-24 sm:py-32 px-6 bg-surface-50/50 border-y border-surface-100">
          <div className="max-w-5xl mx-auto">
            <SectionHeading
              badge="Product Roadmap"
              title="What's coming next"
              subtitle="We're building the most comprehensive AI study platform. Here's what's on the horizon."
            />

            <FadeIn>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ROADMAP.map((item) => (
                  <div key={item.label} className="bg-white rounded-2xl border border-surface-200/70 p-6 flex items-center gap-4 opacity-80 hover:opacity-100 hover:shadow-sm transition-all duration-300">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-400 shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-surface-800 block truncate">{item.label}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-500 border border-primary-100 shrink-0">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ━━━ WHY IT'S DIFFERENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-24 sm:py-32 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              badge="What Makes Us Different"
              title="Built for serious learners"
              subtitle="Study Coach isn't a generic chatbot. It's a purpose-built AI learning platform."
            />

            <div className="grid sm:grid-cols-2 gap-6">
              {DIFFERENTIATORS.map((d, i) => (
                <FadeIn key={d.title} delay={i * 0.08}>
                  <div className="group bg-surface-50 rounded-2xl border border-surface-100 p-8 hover:bg-white hover:shadow-card-hover hover:border-surface-200 transition-all duration-300">
                    <div className="w-14 h-14 bg-white rounded-2xl border border-surface-200 flex items-center justify-center mb-5 text-primary-600 shadow-sm group-hover:shadow-md group-hover:border-primary-200 transition-all duration-300">
                      <d.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-xl text-surface-900 mb-2">{d.title}</h3>
                    <p className="text-surface-500 text-sm leading-relaxed">{d.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ FAQ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="faq" className="py-24 sm:py-32 px-6 bg-surface-50/50 border-y border-surface-100">
          <div className="max-w-3xl mx-auto">
            <SectionHeading
              badge="FAQ"
              title="Frequently asked questions"
              subtitle="Everything you need to know about Study Coach."
            />

            <FadeIn>
              <div className="space-y-4">
                {[
                  { q: 'Is Study Coach free?', a: 'Yes! You can create a free account and start using the AI Tutor, document upload, and conversation history features immediately.' },
                  { q: 'What file formats are supported?', a: 'Currently, Study Coach supports PDF files and presentations. We are working on adding support for more formats including images of handwritten notes.' },
                  { q: 'How does the AI Tutor work?', a: 'Study Coach uses Retrieval-Augmented Generation (RAG). When you ask a question, the AI retrieves relevant passages from your uploaded documents and generates an accurate, cited answer.' },
                  { q: 'Is my data secure?', a: 'Absolutely. All authentication is handled with JWT tokens, passwords are hashed with bcrypt, and email verification is required. Your documents are stored securely and only accessible to you.' },
                  { q: 'When will quizzes and flashcards be available?', a: 'Adaptive quizzes, flashcards, and the other roadmap features are actively in development. Follow our updates for launch announcements.' },
                ].map((faq) => (
                  <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ━━━ FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-24 sm:py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-[-50%] right-[-20%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <FadeIn>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
                Ready to study smarter?
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-primary-100 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Create your free account and let AI become your personal study partner.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="rounded-full px-10 bg-white text-primary-700 hover:bg-primary-50 shadow-lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="rounded-full px-10 border-white/30 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-surface-900 text-surface-100 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🎓</span>
                </div>
                <span className="font-display font-bold text-lg text-white">Study Coach</span>
              </div>
              <p className="text-surface-100/50 text-sm leading-relaxed">
                AI-powered personalized learning platform that helps students study smarter, not harder.
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Features</h4>
              <ul className="space-y-2.5">
                {['AI Tutor', 'Document Upload', 'Conversation History', 'Authentication'].map((item) => (
                  <li key={item}><span className="text-surface-100/50 text-sm hover:text-surface-100/80 transition-colors cursor-default">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Roadmap */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Roadmap</h4>
              <ul className="space-y-2.5">
                {['Adaptive Quizzes', 'AI Flashcards', 'Smart Summaries', 'Study Planner'].map((item) => (
                  <li key={item}><span className="text-surface-100/50 text-sm cursor-default">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Links</h4>
              <ul className="space-y-2.5">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-surface-100/50 text-sm hover:text-surface-100/80 transition-colors">GitHub</a></li>
                <li><span className="text-surface-100/50 text-sm cursor-default">Privacy Policy</span></li>
                <li><span className="text-surface-100/50 text-sm cursor-default">Terms of Service</span></li>
                <li><span className="text-surface-100/50 text-sm cursor-default">Contact</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-surface-100/40 text-xs">
              © {new Date().getFullYear()} Study Coach. All rights reserved.
            </p>
            <p className="text-surface-100/40 text-xs">
              Built with ❤️ for students everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── FAQ Accordion Item ─────────────────────────────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-surface-200/70 overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-semibold text-surface-900 text-sm sm:text-base pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-surface-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-6 text-surface-500 text-sm leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}
