import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bug, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supportApi } from '../../api/support';
import type { BugReportCreate } from '../../api/support';

export default function BugReport() {
  const [formData, setFormData] = useState<BugReportCreate>({
    browser: '',
    operating_system: '',
    current_url: '',
    timestamp: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [successBugId, setSuccessBugId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-fill system info
    setFormData((prev) => ({
      ...prev,
      browser: navigator.userAgent, // A simple way to capture browser info
      operating_system: navigator.platform,
      current_url: window.location.href,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessBugId(null);

    try {
      const dataToSubmit = { ...formData, screenshot: screenshot || undefined };
      const res = await supportApi.createBugReport(dataToSubmit);
      setSuccessBugId(res.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit bug report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  if (successBugId) {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-surface-200 shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Bug Reported</h2>
          <p className="text-surface-600 mb-6">
            Bug report <span className="font-mono font-semibold text-surface-900">{successBugId.split('-')[0]}</span> has been submitted. Thank you for helping us improve!
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
          <h1 className="text-3xl font-display font-bold tracking-tight">Report a Bug</h1>
          <p className="text-surface-500">Provide details about the issue you encountered. System diagnostics have been auto-filled.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-surface-50 p-4 rounded-xl border border-surface-100 text-sm font-mono text-surface-600 space-y-1">
              <p><span className="font-semibold text-surface-700">OS:</span> {formData.operating_system}</p>
              <p className="truncate"><span className="font-semibold text-surface-700">Browser:</span> {formData.browser}</p>
              <p className="truncate"><span className="font-semibold text-surface-700">URL:</span> {formData.current_url}</p>
              <p><span className="font-semibold text-surface-700">Time:</span> {new Date(formData.timestamp || '').toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="steps" className="text-sm font-medium text-surface-700">Steps to Reproduce</label>
              <textarea
                id="steps"
                required
                rows={3}
                placeholder="1. Go to page X...&#10;2. Click on Y...&#10;3. See error Z..."
                value={formData.steps_to_reproduce}
                onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-y"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label htmlFor="expected" className="text-sm font-medium text-surface-700">Expected Behavior</label>
              <textarea
                id="expected"
                required
                rows={2}
                placeholder="What did you expect to happen?"
                value={formData.expected_behavior}
                onChange={(e) => setFormData({ ...formData, expected_behavior: e.target.value })}
                className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-y"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label htmlFor="actual" className="text-sm font-medium text-surface-700">Actual Behavior</label>
              <textarea
                id="actual"
                required
                rows={2}
                placeholder="What actually happened?"
                value={formData.actual_behavior}
                onChange={(e) => setFormData({ ...formData, actual_behavior: e.target.value })}
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
              leftIcon={!isLoading && <Bug className="w-4 h-4" />}
            >
              Submit Bug Report
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
