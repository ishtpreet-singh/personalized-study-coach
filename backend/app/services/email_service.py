import logging
import asyncio
import resend
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """
    Production email service using Resend.
    """
    
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY

    async def _send_email(self, params: dict):
        """Helper to send email in a threadpool since Resend SDK is synchronous."""
        try:
            # We use asyncio.to_thread to avoid blocking the event loop
            response = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent successfully. Response: {response}")
            return response
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send verification email. Please check your email address or try again later."
            )

    async def send_verification_email(self, to_email: str, token: str):
        frontend_url = settings.FRONTEND_URL
        verify_link = f"{frontend_url}/verify-email?token={token}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; text-align: center;">Study Coach</h2>
            <h3 style="color: #334155;">Welcome to Study Coach!</h3>
            <p style="color: #475569; line-height: 1.6;">
                Thank you for registering. To get started and unlock your personalized study experience, please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Verify Email
                </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
                Or copy and paste this link into your browser: <br>
                <a href="{verify_link}" style="color: #2563eb; word-break: break-all;">{verify_link}</a>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">
                If you did not create an account, you can safely ignore this email.
            </p>
        </div>
        """

        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "Verify your Study Coach account",
            "html": html_content
        }

        await self._send_email(params)
        logger.info(f"Verification email dispatched to {to_email}")

    async def send_password_reset_email(self, to_email: str, token: str):
        frontend_url = settings.FRONTEND_URL
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; text-align: center;">Study Coach</h2>
            <h3 style="color: #334155;">Password Reset Request</h3>
            <p style="color: #475569; line-height: 1.6;">
                We received a request to reset the password for your Study Coach account. Click the button below to choose a new password. This link will expire in 30 minutes.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
                Or copy and paste this link into your browser: <br>
                <a href="{reset_link}" style="color: #2563eb; word-break: break-all;">{reset_link}</a>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">
                If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
            </p>
        </div>
        """

        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "Reset your Study Coach password",
            "html": html_content
        }

        await self._send_email(params)
        logger.info(f"Password reset email dispatched to {to_email}")

email_service = EmailService()
