import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const sections = [
  { id: "getting-started", title: "Getting Started" },
  { id: "document-upload", title: "Document Upload" },
  { id: "learning-pipeline", title: "Learning Pipeline" },
  { id: "ai-tutor", title: "AI Tutor" },
  { id: "question-bank", title: "Question Bank" },
  { id: "quiz-engine", title: "Quiz Engine" },
  { id: "learning-analytics", title: "Learning Analytics" },
  { id: "processing-status", title: "Processing Status" },
  { id: "supported-formats", title: "Supported File Types" },
  { id: "privacy", title: "Privacy & Security" },
];

export default function Documentation() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-surface-200 h-auto md:h-screen sticky top-0 overflow-y-auto p-6 hidden md:block">
        <Link to="/help" className="inline-block mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <h2 className="text-xl font-bold mb-4">Documentation</h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full text-left px-3 py-2 text-sm font-medium text-surface-600 hover:text-primary-600 hover:bg-surface-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-4xl">
        <div className="md:hidden mb-6">
          <Link to="/help" className="inline-block">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Help
            </Button>
          </Link>
        </div>

        <div className="space-y-16">
          <section id="getting-started" className="scroll-mt-12">
            <h1 className="text-4xl font-display font-bold mb-4">Study Coach Documentation</h1>
            <p className="text-lg text-surface-600">Welcome to the official documentation for the Personalized AI Study Coach. This guide will walk you through everything from uploading your first document to mastering concepts with the AI Tutor.</p>
          </section>

          <section id="document-upload" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Document Upload</h2>
            <p className="text-surface-600 mb-4">The core of Study Coach revolves around the study materials you provide. From the Dashboard, click "Upload Material" to select a PDF or text file from your computer.</p>
          </section>

          <section id="learning-pipeline" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Learning Pipeline</h2>
            <p className="text-surface-600 mb-4">Once uploaded, documents enter the Learning Pipeline, an automated system that:</p>
            <ul className="list-disc pl-5 text-surface-600 space-y-2">
              <li>Extracts text and generates vector embeddings for semantic search.</li>
              <li>Uses AI to identify core concepts and topics.</li>
              <li>Generates a tailored question bank to test your knowledge.</li>
            </ul>
          </section>

          <section id="ai-tutor" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">AI Tutor</h2>
            <p className="text-surface-600 mb-4">The AI Tutor is an interactive chatbot that acts as your personal teacher. It has full context of your uploaded documents and can answer specific questions, summarize chapters, and explain difficult concepts.</p>
          </section>

          <section id="question-bank" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Question Bank</h2>
            <p className="text-surface-600 mb-4">As part of the Learning Pipeline, the system automatically generates dozens of questions based on the extracted topics. These form the Question Bank used for generating quizzes.</p>
          </section>

          <section id="quiz-engine" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Quiz Engine</h2>
            <p className="text-surface-600 mb-4">Navigate to the Quizzes page to test your knowledge. The engine creates dynamic quizzes based on your study materials, allowing you to track your comprehension over time.</p>
          </section>

          <section id="learning-analytics" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Learning Analytics</h2>
            <p className="text-surface-600 mb-4">Your performance on quizzes is tracked to identify your strengths and weaknesses. The AI Tutor uses this data to recommend topics for review.</p>
          </section>

          <section id="processing-status" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Processing Status</h2>
            <p className="text-surface-600 mb-4">Documents move through various statuses:</p>
            <ul className="list-disc pl-5 text-surface-600 space-y-2">
              <li><strong>Uploading:</strong> File transfer to the server.</li>
              <li><strong>Processing:</strong> Text chunking and embedding.</li>
              <li><strong>Extracting Topics:</strong> Identifying key concepts.</li>
              <li><strong>Generating Questions:</strong> Building the Question Bank.</li>
              <li><strong>Completed:</strong> Ready for quizzes and chat.</li>
              <li><strong>Failed:</strong> An error occurred. Check the error message for details.</li>
            </ul>
          </section>

          <section id="supported-formats" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Supported File Types</h2>
            <p className="text-surface-600 mb-4">Currently, we support PDF documents (.pdf) and raw text files (.txt). Future updates will add support for DOCX and PPTX.</p>
          </section>

          <section id="privacy" className="scroll-mt-12">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Privacy & Security</h2>
            <p className="text-surface-600 mb-4">Your documents are stored securely and are only accessible by you. We do not use your study materials to train public AI models. All interactions with the AI Tutor are kept private.</p>
          </section>

        </div>
      </main>
    </div>
  );
}
