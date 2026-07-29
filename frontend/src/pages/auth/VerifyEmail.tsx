import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authApi } from "../../api/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const effectRan = useRef(false); // strict mode double effect prevention

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    if (!token) {
      setStatus("error");
      setErrorMsg("Missing verification token.");
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.response?.data?.detail || "Failed to verify email. The link may have expired.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              <h2 className="text-xl font-medium text-surface-900">Verifying Email...</h2>
              <p className="text-sm text-surface-500">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <CheckCircle className="w-16 h-16 text-success-500" />
              <h2 className="text-2xl font-bold text-surface-900">Email Verified!</h2>
              <p className="text-sm text-surface-600">
                Your email has been successfully verified. You can now log into your account.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <XCircle className="w-16 h-16 text-danger-500" />
              <h2 className="text-2xl font-bold text-surface-900">Verification Failed</h2>
              <p className="text-sm text-danger-600 font-medium">{errorMsg}</p>
              <p className="text-sm text-surface-500">
                If the link expired, please log in to request a new one.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-6 border border-surface-300 rounded-md shadow-sm text-sm font-medium text-surface-700 bg-white hover:bg-surface-50"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
