import re

from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User


@override_settings(DEBUG=False, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="asha@example.com", password="OldPass#1234", name="Asha")

    def test_full_flow(self):
        res = self.client.post("/api/auth/forgot-password/", {"email": "asha@example.com"})
        self.assertEqual(res.status_code, 200)
        code = re.search(r"\b(\d{6})\b", mail.outbox[0].body).group(1)

        bad = self.client.post("/api/auth/verify-otp/", {"email": "asha@example.com", "otp": "000000"})
        self.assertEqual(bad.status_code, 400)

        ok = self.client.post("/api/auth/verify-otp/", {"email": "asha@example.com", "otp": code})
        self.assertEqual(ok.status_code, 200)

        done = self.client.post(
            "/api/auth/reset-password/",
            {"reset_token": ok.data["reset_token"], "new_password": "BrandNew#5678"},
        )
        self.assertEqual(done.status_code, 200)
        login = self.client.post("/api/auth/login/", {"email": "asha@example.com", "password": "BrandNew#5678"})
        self.assertEqual(login.status_code, 200)

        reuse = self.client.post(
            "/api/auth/reset-password/",
            {"reset_token": ok.data["reset_token"], "new_password": "Another#9999"},
        )
        self.assertEqual(reuse.status_code, 400)

    def test_unknown_account_gets_same_response(self):
        res = self.client.post("/api/auth/forgot-password/", {"email": "nobody@example.com"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_register_and_login(self):
        res = self.client.post(
            "/api/auth/register/",
            {"name": "Ravi Kumar", "email": "ravi@example.com", "password": "Str0ng#Pass1"},
        )
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
