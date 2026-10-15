import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from accounts.models import PasswordResetOTP, User


def find_user(email: str):
    return User.objects.filter(email__iexact=(email or "").strip(), is_active=True).first()


def generate_otp() -> str:
    return f"{secrets.randbelow(10 ** settings.OTP_LENGTH):0{settings.OTP_LENGTH}d}"


def hash_otp(otp: str, user_id: int) -> str:
    msg = f"{user_id}:{otp}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


def create_otp(user: User):
    """Invalidate older OTPs and create a new one. Returns (record, plain_otp)."""
    PasswordResetOTP.objects.filter(user=user, used=False).update(used=True)
    otp = generate_otp()
    record = PasswordResetOTP.objects.create(
        user=user,
        otp_hash=hash_otp(otp, user.id),
        expires_at=timezone.now() + timedelta(minutes=settings.OTP_TTL_MINUTES),
    )
    return record, otp


def in_cooldown(user: User) -> bool:
    last = PasswordResetOTP.objects.filter(user=user).order_by("-created_at").first()
    if not last:
        return False
    return (timezone.now() - last.created_at).total_seconds() < settings.OTP_RESEND_COOLDOWN_SECONDS


def check_otp(user: User, otp: str):
    """Returns the verified record, or None. Counts failed attempts."""
    record = PasswordResetOTP.objects.filter(user=user, used=False).order_by("-created_at").first()
    if not record or record.is_expired() or record.attempts >= settings.OTP_MAX_ATTEMPTS:
        return None
    if hmac.compare_digest(record.otp_hash, hash_otp(otp, user.id)):
        record.verified = True
        record.save(update_fields=["verified"])
        return record
    record.attempts += 1
    record.save(update_fields=["attempts"])
    return None
