# InterviewIQ

Free AI mock interview coach for students. Voice answers, resume-based questions, scorecards on content, structure and delivery.
Built for the IBM SkillsBuild project (UN SDG 8: Decent Work and Economic Growth).

**Stack:** Next.js 14 + Tailwind + Auth.js | Django REST Framework + JWT | Gemini / Groq (free tiers) | Postgres (Supabase/Neon) or SQLite | Web Speech API for voice.

## Run locally

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # fill in keys (all optional for a first run)
python manage.py makemigrations accounts interviews
python manage.py migrate
python manage.py createsuperuser                       # optional, for /admin
python manage.py runserver                             # http://localhost:8000
```
Run the tests: `python manage.py test accounts`

### 2. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local                       # fill in values
npm run dev                                            # http://localhost:3000
```

## What works with no keys at all
- Email/password register and login.
- Forgot password: the OTP email prints in the Django console and the code shows on the verify screen (local demo mode only).
- Interviews: question bank + rule-based scoring. Add `GEMINI_API_KEY` or `GROQ_API_KEY` for AI follow-ups, resume questions and smarter feedback.

## Free keys and setup
| What | Where |
|---|---|
| Gemini API key | aistudio.google.com (free tier, rate limited) |
| Groq API key | console.groq.com (free tier) |
| Google login | Google Cloud Console > APIs & Services > Credentials > OAuth client ID (Web). Redirect URI: `http://localhost:3000/api/auth/callback/google` and your Vercel URL + `/api/auth/callback/google`. Put the same Client ID in `backend/.env` and `frontend/.env.local` |
| Email OTP | Gmail: turn on 2-step verification, create an App Password, set `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` |
| Database | Supabase or Neon free Postgres. Paste the connection string into `DATABASE_URL` |

Free-tier limits change. Check each provider's pricing page.

## Deploy (all free)
1. **Backend on Render:** push to GitHub, create a Blueprint from `render.yaml`, set the env vars it lists. The free instance sleeps when idle, so the first request after a break is slow.
2. **Frontend on Vercel:** import the repo, set root directory to `frontend`, add the `.env.local` values (use your Render URL + `/api` for `NEXT_PUBLIC_API_URL`, your Vercel URL for `NEXTAUTH_URL`).
3. Add the Vercel URL to `CORS_ALLOWED_ORIGINS` on Render, and the Vercel callback URL to the Google OAuth client.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | name, email, password |
| POST | `/api/auth/login/` | email, password |
| POST | `/api/auth/google/` | Google ID token |
| POST | `/api/auth/token/refresh/` | refresh JWT |
| POST | `/api/auth/forgot-password/` | email, sends a 6-digit OTP by email |
| POST | `/api/auth/verify-otp/` | email + 6-digit OTP, returns reset token |
| POST | `/api/auth/reset-password/` | reset token + new password |
| GET/POST | `/api/interviews/` | list / start (multipart: role, difficulty, total_questions, resume) |
| GET | `/api/interviews/<id>/` | session with turns |
| POST | `/api/interviews/<id>/answer/` | answer_text, duration_seconds, skipped |
| POST | `/api/interviews/<id>/finish/` | build the report |
| GET | `/api/interviews/stats/` | dashboard numbers |

## Security notes
OTPs are hashed, expire in 10 minutes, allow 5 attempts, and are single-use. Forgot-password gives the same response for unknown accounts. Rate limits are on auth and OTP endpoints. Never commit `.env` files.
