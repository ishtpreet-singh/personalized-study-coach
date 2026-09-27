import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supportApi } from '../../api/support';
import type { SupportTicketCreate } from '../../api/support';

export default function ContactSupport() {
  const [formData, setFormData] = useState<SupportTicketCreate>({
    name: '',
    email: '',
    subject: '',
    description: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessTicketId(null);

    try {
      const dataToSubmit = { ...formData, screenshot: screenshot || undefined };
      const res = await supportApi.createSupportTicket(dataToSubmit);
      setSuccessTicketId(res.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit support ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  if (successTicketId) {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-surface-200 shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
          <p className="text-surface-600 mb-6">
            Support ticket <span className="font-mono font-semibold text-surface-900">{successTicketId.split('-')[0]}</span> has been created. Our team will get back to you shortly.
          </p>
          <Link to="/help">
            <Button className="w-full">Return to Help</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <Link to="/help" className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Help
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold tracking-tight">Contact Support</h1>
          <p className="text-surface-500">Fill out the form below and our team will get back to you.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium text-surface-700">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-surface-700">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="subject" className="text-sm font-medium text-surface-700">Subject</label>
              <input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium text-surface-700">Description</label>
              <textarea
                id="description"
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-y"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label htmlFor="screenshot" className="text-sm font-medium text-surface-700">Screenshot (Optional)</label>
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              isLoading={isLoading}
              leftIcon={!isLoading && <Send className="w-4 h-4" />}
            >
              Submit Ticket
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
