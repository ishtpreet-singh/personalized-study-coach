import { apiClient } from "./client";

export const authApi = {
  async verifyEmail(token: string) {
    const response = await apiClient.get(`/api/v1/auth/verify-email?token=${token}`);
    return response.data;
  },

  async resendVerification(email: string) {
    const response = await apiClient.post("/api/v1/auth/resend-verification", { email });
    return response.data;
  },

  async requestPasswordReset(email: string) {
    const response = await apiClient.post("/api/v1/auth/reset-password-request", { email });
    return response.data;
  },

  async resetPassword(token: string, new_password: string) {
    const response = await apiClient.post("/api/v1/auth/reset-password", { token, new_password });
    return response.data;
  },

  async googleLogin(code: string, redirect_uri: string) {
    const response = await apiClient.post("/api/v1/auth/google", { code, redirect_uri });
    return response.data;
  }
};
