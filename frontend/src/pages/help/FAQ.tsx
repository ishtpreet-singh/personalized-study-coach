import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';

const faqs = [
  {
    question: "How do I upload documents?",
    answer: "You can upload documents from your Dashboard by clicking the 'Upload Material' button or dragging and dropping files into the upload area. The system will immediately begin processing your document."
  },
  {
    question: "What file types are supported?",
    answer: "Currently, we support PDF (.pdf) and text (.txt) files. Support for Word documents (.docx) and PowerPoint (.pptx) is coming soon."
  },
  {
    question: "Why does document processing take time?",
    answer: "When you upload a document, our Learning Pipeline extracts text, generates embeddings for search, extracts key topics, and generates a personalized question bank for quizzes. This ensures a high-quality AI tutoring experience."
  },
  {
    question: "How are quizzes generated?",
    answer: "Quizzes are generated dynamically from the Question Bank created during document processing. The system selects a mix of questions across different topics and difficulty levels to test your comprehension."
  },
  {
    question: "How does the AI Tutor work?",
    answer: "The AI Tutor acts as a study assistant. You can chat with it to ask questions about the material, ask it to summarize sections, or have it explain complex topics in simpler terms."
  },
  {
    question: "What do the processing statuses mean?",
    answer: "'Uploading' means the file is being transferred. 'Processing' indicates text extraction. 'Extracting Topics' and 'Generating Questions' are the AI stages. 'Completed' means the document is fully ready for quizzes."
  },
  {
    question: "How do I troubleshoot failed documents?",
    answer: "If a document fails, it usually means the file was corrupted, encrypted, or too large. You can view the specific error message by hovering over the 'Failed' status icon. Try deleting and re-uploading the document."
  },
  {
    question: "I have an issue with my account, who do I contact?",
    answer: "For account-related issues, please use our Contact Support page to send a message directly to our team."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <Link to="/help" className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Help
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-surface-500">Quick answers to common questions about using Study Coach.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
              <button
                className="w-full px-6 py-4 flex items-center justify-between focus:outline-none focus:bg-surface-50 hover:bg-surface-50 transition-colors text-left"
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-surface-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-surface-400" />
                )}
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4 pt-2 text-surface-600">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
