# GetOnlyPros Backend Deployment Guide

## Overview

This backend powers the GetOnlyPros lead generation platform with:
- **15 automated lead generation agents** running on scheduled cron jobs
- **Real-time WebSocket** lead delivery to contractors
- **Gift card engine** for lead conversion
- **Full REST API** for contractor dashboard
- **Stripe payments**, Twilio SMS, Resend email, Tango Card integrations

---

## Prerequisites

1. **MongoDB Atlas account** (free M0 cluster is fine to start)
2. **Render.com account** (free tier works)
3. **GitHub account** (to host the code)

---

## Step 1: Create MongoDB Atlas Cluster

1. Go to https://cloud.mongodb.com and sign up/log in
2. Create a new project called "GetOnlyPros"
3. Click "Build a Cluster" → Choose **M0 (Free)**
4. Select AWS as cloud provider, choose a region close to your users
5. In Database Access, create a user:
   - Username: `gop_admin`
   - Password: Generate a strong password, save it
   - Role: `Atlas Admin`
6. In Network Access, click "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
7. Go to Clusters → Click "Connect" → "Drivers" → "Node.js"
8. Copy the connection string, replace `<password>` with your password:
   ```
   mongodb+srv://gop_admin:<password>@cluster0.xxxxx.mongodb.net/getonlypros?retryWrites=true&w=majority
   ```

---

## Step 2: Push Code to GitHub

1. Create a new private repo on GitHub called `getonlypros-api`
2. From this backend folder, push the code:
   ```bash
   git init
   git add .
   git commit -m "GetOnlyPros Backend v2 - 15 lead generation agents"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/getonlypros-api.git
   git push -u origin main
   ```

**Important**: Only push these files/folders:
- `dist/` (compiled JavaScript)
- `package.json`
- `Dockerfile`
- `.dockerignore`
- `render.yaml`
- `.env.production` (template only - don't push real secrets)

Do NOT push:
- `src/` (source TypeScript - already compiled to dist/)
- `node_modules/`
- `.env` with real values

---

## Step 3: Deploy on Render

### Option A: Blueprint Deploy (Recommended)

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repo `getonlypros-api`
4. Render will read `render.yaml` and create the service
5. After creation, go to the service → Environment
6. Add all required environment variables (see table below)

### Option B: Manual Web Service

1. Go to https://dashboard.render.com/
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Select "Docker" as runtime
5. Set:
   - **Name**: `getonlypros-api`
   - **Region**: Oregon (US West) or closest to your users
   - **Branch**: `main`
   - **Root Directory**: `./`
   - **Dockerfile Path**: `./Dockerfile`
6. Set environment variables (see table below)
7. Click "Create Web Service"

---

## Step 4: Environment Variables

| Variable | Required | Description | How to Get |
|----------|----------|-------------|------------|
| `MONGODB_URI` | Yes | MongoDB connection string | MongoDB Atlas (Step 1) |
| `JWT_SECRET` | Yes | Random 64-char string for JWT | Generate: `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Yes | Different 64-char string | Generate: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | No | Token expiry | Default: `7d` |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh expiry | Default: `30d` |
| `CORS_ORIGIN` | No | Allowed frontend URLs | Default: `https://getonlypros.com` |
| `RESEND_API_KEY` | No | For transactional email | https://resend.com (free: 100/day) |
| `STRIPE_SECRET_KEY` | No | Payment processing | https://stripe.com |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook verification | Stripe Dashboard |
| `TANGO_CARD_API_KEY` | No | Gift card distribution | https://tangocard.com |
| `TWILIO_ACCOUNT_SID` | No | SMS sending | https://twilio.com |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth | Twilio Console |
| `TWILIO_PHONE_NUMBER` | No | SMS sender number | Twilio Console |
| `REDIS_URL` | No | Caching (optional) | https://upstash.com (free tier) |

### Quick Setup (Free Tier Only)

For a fully functional free deployment, you only need:
```
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<generate-random-64-char>
JWT_REFRESH_SECRET=<generate-different-random-64-char>
CORS_ORIGIN=https://znffhjj7mkv5m.kimi.page
RESEND_API_KEY=<optional-get-from-resend.com>
```

The 15 lead generation agents will work and generate leads immediately with just MONGODB_URI and JWT secrets. Email/SMS/Gift cards activate when you add those API keys.

---

## Step 5: Verify Deployment

Once deployed, your API will be at:
```
https://getonlypros-api.onrender.com
```

### Health Check
```bash
curl https://getonlypros-api.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "scheduler": "running",
    "websocket": "active"
  }
}
```

### Check Agents
```bash
curl https://getonlypros-api.onrender.com/api/agents
```

Should return 15 agents with their status.

### Trigger an Agent Manually
```bash
curl -X POST https://getonlypros-api.onrender.com/api/agents/email-survey/trigger
```

---

## Step 6: Update Frontend

1. Go to your frontend code at `/mnt/agents/output/app/`
2. Update `.env.production`:
   ```
   VITE_API_BASE_URL=https://getonlypros-api.onrender.com/api
   ```
3. Rebuild and redeploy the frontend
4. The contractor dashboard will now connect to your live backend

---

## Agent Schedule (Automatic)

All 15 agents run automatically once deployed:

| Agent | Schedule | What It Does |
|-------|----------|--------------|
| **Email Survey** | Daily 9am | Sends surveys to past customers |
| **Weather Trigger** | Every 15 min | Monitors storms, triggers service alerts |
| **Social Signal** | Every 30 min | Mines Reddit/Nextdoor for intent signals |
| **Gift Card Engine** | Every 10 min | Processes gift card rewards |
| **SMS Alert** | Every 5 min | Sends SMS for high-urgency leads |
| **Google Ads** | Every 2 hours | Syncs Google Ads lead data |
| **Facebook Ads** | Every 2 hours | Syncs Meta Lead Ads data |
| **SEO Content** | Daily 8am | Tracks organic search leads |
| **New Mover** | Daily 7am | Targets new homeowners |
| **Warranty Expiration** | Daily 6am | Proactive warranty outreach |
| **Competitor Review** | Every 6 hours | Mines 1-2 star competitor reviews |
| **Building Permit** | Every 4 hours | Scrapes city building permits |
| **Pricing Intelligence** | Daily noon | Market gap analysis |
| **Market Analysis** | Daily 5am | Demand surge prediction |
| **Churn Recovery** | Daily 10am | Re-engages past leads |

You can manually trigger any agent via:
```bash
POST /api/agents/{slug}/trigger
```

---

## API Endpoints

### Leads (v2)
- `GET /api/v2/leads` - List leads with filters (source, score, zip, service)
- `GET /api/v2/leads/:id` - Get single lead
- `POST /api/v2/leads` - Create lead
- `GET /api/v2/leads/stats` - Lead statistics by source

### Agents
- `GET /api/agents` - List all 15 agents with stats
- `GET /api/agents/:slug` - Get agent details
- `POST /api/agents/:slug/trigger` - Manually trigger agent
- `GET /api/agents/:slug/runs` - Get execution history

### Gift Cards
- `GET /api/gift-cards` - List gift cards
- `POST /api/gift-cards` - Create gift card
- `POST /api/gift-cards/:id/send` - Send gift card

### Referrals
- `GET /api/referrals` - List referrals
- `POST /api/referrals` - Create referral

### Weather
- `GET /api/weather/alerts` - Active weather alerts
- `GET /api/weather/events` - Weather events history

### Auth, Contractors, Earnings, Reviews (from v1)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user
- `GET /api/contractors` - List contractors
- `GET /api/contractors/:id/leads` - Contractor's leads
- `GET /api/contractors/:id/earnings` - Earnings history
- `GET /api/contractors/:id/dashboard/stats` - Dashboard stats

### WebSocket
- `wss://getonlypros-api.onrender.com/ws/leads` - Real-time lead stream

---

## Troubleshooting

### Build Fails
- Check Docker build logs in Render dashboard
- Ensure `dist/` folder is committed to git
- Verify `package.json` has all dependencies

### Database Connection Error
- Verify `MONGODB_URI` is correct
- Check Network Access in MongoDB Atlas (0.0.0.0/0)
- Ensure password is URL-encoded if it contains special characters

### Agents Not Running
- Check `/health` endpoint - scheduler should show "running"
- Check Render logs for initialization messages
- Manually trigger an agent via API to test

### CORS Errors
- Update `CORS_ORIGIN` to include your frontend URL
- Multiple URLs: comma-separated, no spaces

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   RENDER.COM (Docker)                │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Express API  │  │  Scheduler   │  │ WebSocket │  │
│  │  (REST)      │  │  (node-cron) │  │ (ws lib)  │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                  │                  │        │
│  ┌──────┴──────────────────┴──────────────────┴──────┐ │
│  │           AgentRegistry (15 Agents)               │ │
│  │  EmailSurvey │ Weather │ Social │ GiftCard │ SMS  │ │
│  │  GoogleAds   │ Facebook│ SEO    │ NewMover │ ...  │ │
│  └───────────────────────────────────────────────────┘ │
│                        │                               │
│  ┌─────────────────────┴──────────────────────────┐    │
│  │              MongoDB Atlas                      │    │
│  │  Leads │ Contractors │ Agents │ GiftCards │ ... │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps After Deploy

1. **Seed initial data**: Use the seed script or API to create demo contractors
2. **Enable integrations**: Add Resend, Twilio, Stripe API keys as you get them
3. **Monitor agents**: Check agent run logs via `/api/agents/:slug/runs`
4. **Scale**: Upgrade Render plan and MongoDB tier as traffic grows

---

**Questions?** Check the Render logs (Dashboard → Service → Logs) for detailed error messages.
