import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Bug, Mail, MessageCircleQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Help() {
  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <Link to="/login" className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Login
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold tracking-tight">Help & Support</h1>
          <p className="text-surface-500">Find answers or reach out to our team for assistance.</p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link to="/help/faq" className="block p-6 bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <MessageCircleQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-700 transition-colors">Frequently Asked Questions</h3>
            <p className="text-surface-500 text-sm">Find quick answers to common issues and questions about AI features.</p>
          </Link>

          <Link to="/help/docs" className="block p-6 bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-700 transition-colors">Documentation</h3>
            <p className="text-surface-500 text-sm">Getting started guides, API references, and detailed tutorials.</p>
          </Link>

          <Link to="/help/contact" className="block p-6 bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-700 transition-colors">Contact Support</h3>
            <p className="text-surface-500 text-sm">Need direct help? Email our support team and we'll get back to you.</p>
          </Link>

          <Link to="/help/bug-report" className="block p-6 bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
              <Bug className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-700 transition-colors">Report a Bug</h3>
            <p className="text-surface-500 text-sm">Found an issue with the AI Tutor or Quizzes? Let us know so we can fix it.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
