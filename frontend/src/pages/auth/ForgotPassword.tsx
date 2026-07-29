import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, ShieldCheck, CheckCircle2, Lock, Zap, Send } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { authApi } from "../../api/auth";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      await authApi.requestPasswordReset(email);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      if (axios.isAxiosError(err) && err.response) {
        setErrorMsg(err.response.data?.detail || "Failed to process request. Please try again.");
      } else {
        setErrorMsg("Failed to process request. Please try again.");
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header section outside the card */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <Mail className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold text-surface-900 tracking-tight mb-3">
          Reset your password
        </h2>
        <p className="text-surface-500 text-sm max-w-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full"
      >
        <Card className="border border-surface-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-2xl overflow-hidden bg-white mb-10">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-50 mb-6">
                    <CheckCircle2 className="h-8 w-8 text-primary-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-2">Check your email</h3>
                  <p className="text-sm text-surface-500 mb-8">
                    We've sent password reset instructions to <br />
                    <span className="font-semibold text-surface-900 mt-1 block">{email}</span>
                  </p>
                  <Link to="/login" className="block w-full">
                    <Button variant="primary" className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                      Return to login
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-surface-900 mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-surface-400" strokeWidth={1.5} />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          disabled={status === "loading"}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-11 pr-3 py-3 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-60 bg-white"
                          placeholder="Enter your email address"
                        />
                      </div>
                      
                      <div className="flex items-start mt-3 gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p className="text-xs text-surface-500">
                          We'll only use your email to send you password reset instructions.
                        </p>
                      </div>
                    </div>

                    {status === "error" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg p-3"
                      >
                        {errorMsg}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      isLoading={status === "loading"}
                      className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all"
                    >
                      {status === "loading" ? "Sending reset link..." : (
                        <span className="flex items-center justify-center">
                          Send reset link <Send className="ml-2 h-4 w-4" strokeWidth={1.5} />
                        </span>
                      )}
                    </Button>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-surface-100" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-surface-400">or</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={2} />
                        Back to login
                      </Link>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Value Props / Features Footer */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <Lock className="h-5 w-5 text-primary-600" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-0.5">Secure</h4>
            <p className="text-xs text-surface-500 leading-relaxed">
              Your data is protected with industry-standard encryption
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <Zap className="h-5 w-5 text-primary-600" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-0.5">Fast</h4>
            <p className="text-xs text-surface-500 leading-relaxed">
              Get back to learning as quickly as possible
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <ShieldCheck className="h-5 w-5 text-primary-600" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-0.5">Reliable</h4>
            <p className="text-xs text-surface-500 leading-relaxed">
              Trusted by thousands of students
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
