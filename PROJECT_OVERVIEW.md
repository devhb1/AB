# AHB26 - AI Context Engine

## 🎯 What We Built

A unified context platform that solves knowledge loss in fast-moving teams.

## 🏗️ Architecture Overview

### Frontend Flow
1. **Landing Page** (unauthenticated)
   - Marketing copy explaining AHB26
   - What we are, what we provide, how we do it, what problem we solve
   - "Get Started" → Clerk signup
   - "Sign In" → Clerk signin

2. **Dashboard** (authenticated)
   - Workspace creation form
   - Integration setup for Slack, GitHub, Gmail
   - Context sync and ingestion control
   - Real-time stats showing stored context

### Backend Architecture

**Data Flow:**
```
User Sources (Slack, GitHub, Gmail) 
    ↓
Connectors (pull data)
    ↓
PostgreSQL + pgvector (store events + embeddings)
    ↓
AI Reasoning (OpenAI embeddings)
    ↓
Decision Synthesis & Timeline
```

### Core Components

#### 1. **Landing Page** (`src/components/LandingPage.tsx`)
- AHB26 branding and positioning
- 5 main sections:
  - What We Are
  - What We Provide
  - How We Do It
  - The Problem We Solve
  - CTA section

#### 2. **Dashboard** (`src/components/Dashboard.tsx`)
- Workspace management
- Three integration panels:
  - **Slack**: Connect channels, pull conversation history
  - **GitHub**: Track commits, PRs, issues
  - **Gmail**: Sync email threads
- One-click sync to start ingestion

#### 3. **API Routes** (`src/app/api/`)
- `/api/accounts` - Create user account
- `/api/workspaces` - Create workspace, list workspaces
- `/api/workspaces/[id]/connections` - Connect data sources
- `/api/ingest/*` - Connector logic (Slack, GitHub, Gmail, manual)
- `/api/onboarding/sync` - Trigger ingestion pipeline
- `/api/query/decision` - AI decision synthesis
- `/api/stats` - Dashboard statistics

## 🔄 User Journey

```
1. Land on AHB26.com
   ↓
2. Click "Get Started Free"
   ↓
3. Sign up with Clerk (email/Google/GitHub)
   ↓
4. Redirected to Dashboard
   ↓
5. Create Workspace (name required)
   ↓
6. Connect integrations:
   - Slack: paste channel IDs
   - GitHub: enter owner/repo
   - Gmail: set email search query
   ↓
7. Click "Start Syncing"
   ↓
8. AI processes context:
   - Pulls all messages/commits/emails
   - Creates embeddings
   - Builds decision graph
   ↓
9. Ask questions:
   "Why did we choose this database?"
   → AI synthesizes full decision memo
```

## 📊 Data Model

### Tables
- `event_chunks` - Individual messages/commits/emails with:
  - `user_id`, `workspace_id` (multi-tenancy)
  - `source_type` (slack|github|gmail|manual)
  - `content` + `embedding` (pgvector)
  - Metadata (author, timestamp, external_id)

- `cross_links` - Relationships between chunks:
  - `source_id` → `target_id`
  - `link_type` (hard|conflict|reasoning)
  - `similarity` score
  - `explanation` (AI-generated)

## 🔐 Security & Privacy

- **Multi-tenancy**: Each user/workspace isolated
- **PII Redaction**: Before vector storage (configurable)
- **Self-hosted option**: Data stays on your infrastructure
- **SOC2-ready**: Audit trails, access control

## 🚀 Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4
- **Auth**: Clerk (sign-up, SSO, multi-factor)
- **Database**: PostgreSQL + pgvector (semantic search)
- **AI**: OpenAI embeddings (text-embedding-3-small)
- **Integrations**: 
  - Slack Web API
  - GitHub Octokit
  - Google Gmail API
- **Deployment**: Vercel (frontend), Docker (backend)

## 📈 Next Steps

1. **Test the flow end-to-end** with real Clerk keys
2. **Configure integrations** with actual API credentials
3. **Deploy to Vercel** for production
4. **Add more sources**:
   - Zendesk/Intercom (support)
   - Zoom/Loom (meetings)
   - Linear/Jira (issues)
5. **AI Features**:
   - Decision timeline visualization
   - Automatic weekly summaries
   - Conflict detection
   - Recurring blocker identification

## 📝 Configuration

### Environment Variables Required
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SLACK_BOT_TOKEN=xoxb-...
GITHUB_TOKEN=github_pat_...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

## 🎯 Key Differentiators

1. **Unified Context** - One place for all team knowledge
2. **AI-Powered** - Understands decision reasoning, not just keywords
3. **Secure & Private** - Your data, your control
4. **Fast Onboarding** - 2 minutes to connect sources
5. **Enterprise-Ready** - Multi-workspace, SOC2, self-hosted options

---

**AHB26**: Your team's memory, unified.
