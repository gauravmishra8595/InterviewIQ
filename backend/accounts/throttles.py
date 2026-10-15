from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    scope = "auth"


class _IdentifierThrottle(SimpleRateThrottle):
    """Limits by client IP + the email in the request body."""

    def get_cache_key(self, request, view):
        ident = str(request.data.get("email", "")).strip().lower()
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{self.get_ident(request)}:{ident}",
        }


class OTPRequestThrottle(_IdentifierThrottle):
    scope = "otp_request"


class OTPVerifyThrottle(_IdentifierThrottle):
    scope = "otp_verify"
