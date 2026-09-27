import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import { authApi } from '../api/auth';
import { extractApiError } from '../utils/error';

type LoginStep = 'credentials' | 'otp';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);



  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/api/v1/auth/login', { email, password });
      const data = response.data;

      if (data.requires_2fa) {
        // 2FA required — transition to OTP step
        setPreAuthToken(data.pre_auth_token);
        setStep('otp');
      } else {
        // No 2FA — standard login
        await login(data.access_token);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(extractApiError(err, 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError('');
        setIsSubmitting(true);
        // We pass the authorization code to our backend. 
        // With the popup flow, Google expects the redirect_uri to be exactly 'postmessage'
        const response = await authApi.googleLogin(tokenResponse.code, 'postmessage');
        await login(response.access_token);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } catch (err) {
        setError(extractApiError(err, 'Google login failed. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => setError("Google login failed. Please try again."),
    flow: 'auth-code',
  });

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/api/v1/auth/2fa/login', {
        pre_auth_token: preAuthToken,
        otp_code: otpCode,
      });
      await login(response.data.access_token);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">
            {step === 'otp' ? 'Two-Factor Verification' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {step === 'otp'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter your credentials to access your dashboard'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.form
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleCredentials}
                className="space-y-4 mt-4"
              >
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-surface-700">Password</label>
                    <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-4 pr-12 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
                  Sign In
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-surface-500">Or continue with</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full bg-white" onClick={() => handleGoogleLogin()}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Google
                </Button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleOtp}
                className="space-y-5 mt-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-primary-600" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-700">Authenticator Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9 ]{6,8}"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000 000"
                    maxLength={8}
                    autoFocus
                    required
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-lg text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  <p className="text-xs text-surface-500 text-center">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Verify & Sign In
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setOtpCode(''); }}
                  className="w-full text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  ← Back to login
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center text-sm text-surface-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
