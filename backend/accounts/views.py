import logging

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import PasswordResetOTP, User
from .serializers import (
    ForgotPasswordSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from .services import otp as otp_service
from .services.email_sender import send_otp_email
from .throttles import AuthRateThrottle, OTPRequestThrottle, OTPVerifyThrottle

logger = logging.getLogger(__name__)
RESET_SALT = "interviewiq-password-reset"


def auth_response(user, http_status=status.HTTP_200_OK):
    refresh = RefreshToken.for_user(user)
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data},
        status=http_status,
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return auth_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.is_active or not user.check_password(serializer.validated_data["password"]):
            return Response(
                {"detail": "Wrong email or password. If you signed up with Google, use Continue with Google or reset your password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return auth_response(user)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({"detail": "Google login is not configured on the server."}, status=503)
        try:
            info = google_id_token.verify_oauth2_token(
                serializer.validated_data["id_token"],
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({"detail": "Google sign-in could not be verified."}, status=401)

        if not info.get("email_verified"):
            return Response({"detail": "Your Google email is not verified."}, status=400)

        email = info["email"].lower()
        google_sub = info["sub"]
        user = User.objects.filter(google_id=google_sub).first() or User.objects.filter(email__iexact=email).first()
        if user:
            changed = []
            if not user.google_id:
                user.google_id = google_sub
                changed.append("google_id")
            if not user.picture and info.get("picture"):
                user.picture = info["picture"]
                changed.append("picture")
            if not user.name and info.get("name"):
                user.name = info["name"]
                changed.append("name")
            if changed:
                user.save(update_fields=changed)
        else:
            user = User.objects.create_user(
                email=email,
                password=None,
                name=info.get("name", ""),
                picture=info.get("picture", ""),
                google_id=google_sub,
                auth_provider="google",
            )
        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=403)
        return auth_response(user)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []


GENERIC_SENT = {"detail": "If an account matches, we have emailed a 6-digit code. It expires in 10 minutes."}


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [OTPRequestThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        body = dict(GENERIC_SENT)
        user = otp_service.find_user(serializer.validated_data["email"])

        if user and not otp_service.in_cooldown(user):
            _, code = otp_service.create_otp(user)
            try:
                send_otp_email(user.email, user.name, code)
                if settings.EXPOSE_DEV_OTP:
                    body["dev_otp"] = code  # local demos only, never present when DEBUG is False
            except Exception:  # never reveal delivery problems to the caller
                logger.exception("Failed to deliver OTP")
        return Response(body)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = otp_service.find_user(serializer.validated_data["email"])
        record = otp_service.check_otp(user, serializer.validated_data["otp"]) if user else None
        if not record:
            return Response(
                {"detail": "That code is wrong or has expired. Check the code or request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = signing.dumps({"otp": record.id, "uid": user.id}, salt=RESET_SALT)
        return Response({"reset_token": token})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload = signing.loads(
                serializer.validated_data["reset_token"],
                salt=RESET_SALT,
                max_age=settings.OTP_TTL_MINUTES * 60,
            )
        except signing.BadSignature:
            return Response({"detail": "This reset link has expired. Start again."}, status=400)

        record = PasswordResetOTP.objects.filter(
            id=payload["otp"], user_id=payload["uid"], verified=True, used=False
        ).select_related("user").first()
        if not record:
            return Response({"detail": "This reset link was already used. Start again."}, status=400)

        user = record.user
        try:
            validate_password(serializer.validated_data["new_password"], user=user)
        except DjangoValidationError as exc:
            return Response({"new_password": list(exc.messages)}, status=400)

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        PasswordResetOTP.objects.filter(user=user, used=False).update(used=True)
        return Response({"detail": "Password updated. You can log in now."})
