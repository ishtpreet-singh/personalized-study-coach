import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldOff, QrCode, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import axios from 'axios';

type TwoFAPanel = 'idle' | 'setup' | 'enabling' | 'disabling' | 'done';

export default function Settings() {
  const { user } = useAuth();

  const [panel, setPanel] = useState<TwoFAPanel>('idle');
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [secret, setSecret] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.two_factor_enabled ?? false);

  const extractError = (err: unknown): string => {
    if (axios.isAxiosError(err) && err.response) {
      const detail = err.response.data.detail;
      if (Array.isArray(detail)) {
        return detail.map((d: any) => d.msg.replace('Value error, ', '')).join(' • ');
      }
      return typeof detail === 'string' ? detail : 'Something went wrong.';
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSetup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const resp = await apiClient.post('/api/v1/auth/2fa/setup');
      setQrCodeUri(resp.data.qr_code_uri);
      setSecret(resp.data.secret);
      setPanel('setup');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/2fa/enable', { otp_code: otpCode });
      setTwoFAEnabled(true);
      setPanel('done');
      setSuccess('Two-factor authentication is now active on your account.');
      setOtpCode('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/2fa/disable', { otp_code: otpCode });
      setTwoFAEnabled(false);
      setPanel('idle');
      setSuccess('Two-factor authentication has been disabled.');
      setOtpCode('');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Security Settings</h1>
        <p className="text-surface-500 mt-1 text-sm">Manage your account security and authentication methods.</p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
          <CardDescription>Your profile and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-surface-100">
            <span className="text-sm text-surface-500">Full Name</span>
            <span className="text-sm font-medium text-surface-900">{user?.full_name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-100">
            <span className="text-sm text-surface-500">Email</span>
            <span className="text-sm font-medium text-surface-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-surface-500">Email Verified</span>
            <Badge variant={user?.is_verified ? 'success' : 'warning'}>
              {user?.is_verified ? 'Verified' : 'Not Verified'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
            <Badge variant={twoFAEnabled ? 'success' : 'default'}>
              {twoFAEnabled ? '2FA Active' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Global success banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Idle — not enabled */}
            {!twoFAEnabled && (panel === 'idle') && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4 p-4 bg-surface-50 rounded-xl">
                  <ShieldOff className="w-5 h-5 text-surface-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-surface-800">2FA is not enabled</p>
                    <p className="text-xs text-surface-500 mt-1">
                      Enable two-factor authentication using an authenticator app like Google Authenticator or Authy.
                    </p>
                  </div>
                </div>
                <Button onClick={handleSetup} isLoading={isLoading} className="w-full sm:w-auto">
                  <QrCode className="w-4 h-4 mr-2" />
                  Set Up Two-Factor Authentication
                </Button>
              </motion.div>
            )}

            {/* Setup — show QR code */}
            {panel === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <p className="text-sm font-medium text-surface-800">
                    Step 1 — Scan this QR code with your authenticator app
                  </p>
                  <div className="flex justify-center p-4 bg-white border border-surface-200 rounded-xl">
                    <img src={qrCodeUri} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                  <div className="p-3 bg-surface-50 rounded-xl">
                    <p className="text-xs text-surface-500 mb-1">Can't scan? Enter this key manually:</p>
                    <code className="text-xs font-mono text-surface-800 break-all">{secret}</code>
                  </div>
                </div>

                <form onSubmit={handleEnable} className="space-y-3">
                  <p className="text-sm font-medium text-surface-800">
                    Step 2 — Enter the 6-digit code to confirm
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000 000"
                    maxLength={8}
                    autoFocus
                    required
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-lg text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setPanel('idle'); setError(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Done — just enabled */}
            {panel === 'done' && twoFAEnabled && (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-100 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">2FA is active</p>
                    <p className="text-xs text-green-700 mt-1">
                      Your account is protected. You'll be asked for a code each time you log in.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { setPanel('disabling'); setError(''); setSuccess(''); }}
                >
                  Disable 2FA
                </Button>
              </motion.div>
            )}

            {/* Idle with 2FA already enabled */}
            {twoFAEnabled && panel === 'idle' && (
              <motion.div
                key="enabled-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-100 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">2FA is active</p>
                    <p className="text-xs text-green-700 mt-1">
                      Your account is protected. You'll be asked for a code each time you log in.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { setPanel('disabling'); setError(''); setSuccess(''); }}
                >
                  Disable 2FA
                </Button>
              </motion.div>
            )}

            {/* Disabling — confirm with OTP */}
            {panel === 'disabling' && (
              <motion.div
                key="disabling"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  ⚠️ Disabling 2FA will make your account less secure. Enter your authenticator code to confirm.
                </div>

                <form onSubmit={handleDisable} className="space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000 000"
                    maxLength={8}
                    autoFocus
                    required
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-lg text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm Disable
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setPanel('idle'); setError(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Change Password stub */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
