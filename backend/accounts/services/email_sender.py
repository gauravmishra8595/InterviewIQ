from django.conf import settings
from django.core.mail import send_mail


def send_otp_email(to_email: str, name: str, otp: str):
    minutes = settings.OTP_TTL_MINUTES
    greeting = f"Hi {name.split()[0]}," if name else "Hi,"
    text = (
        f"{greeting}\n\nYour InterviewIQ password reset code is {otp}.\n"
        f"It expires in {minutes} minutes. If you did not ask for this, you can ignore this email.\n"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#1b1f4b">
      <h2 style="margin:0 0 12px">InterviewIQ</h2>
      <p>{greeting}</p>
      <p>Use this code to reset your password:</p>
      <p style="font-size:34px;letter-spacing:10px;font-weight:700;background:#f1efff;padding:14px 18px;border-radius:12px;text-align:center">{otp}</p>
      <p style="color:#555">The code expires in {minutes} minutes. If you did not ask for it, ignore this email.</p>
    </div>
    """
    send_mail(
        subject="Your InterviewIQ password reset code",
        message=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=html,
        fail_silently=False,
    )
