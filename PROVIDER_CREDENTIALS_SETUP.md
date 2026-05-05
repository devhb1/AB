# Provider Credentials Setup Guide

This guide explains how to configure provider credentials for the AHB26 app to enable real Slack, GitHub, and Gmail connections.

## 1. Vercel Environment Variables Configuration

Go to your Vercel project dashboard:
1. **Project Settings** → **Environment Variables**
2. Add each credential below for your deployment environment (Production/Preview/Development)
3. Deploy the new environment variables (they take effect on next deployment)

---

## 2. Slack Configuration

### Required Credentials
- **`SLACK_BOT_TOKEN`** - Bot token for your Slack app

### How to Get Slack Bot Token

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app or select existing app
3. Go to **OAuth & Permissions**
4. Under **Scopes**, add these bot token scopes:
   - `channels:read` - Read channels
   - `channels:history` - Read conversation history
   - `chat:read` - Read messages
5. Click **Install to Workspace** (or reinstall if updating)
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
7. Add to Vercel as `SLACK_BOT_TOKEN`

### How to Use in App
- In dashboard connection modal, enter channel IDs separated by commas (e.g., `general,random,dev`)
- Or leave empty to use default `demo-general`
- Click "Connect Slack"
- Validation will test the token and verify it can access the channels

---

## 3. GitHub Configuration

### Required Credentials
- **`GITHUB_TOKEN`** - Personal access token for your GitHub account
- **`GITHUB_OWNER`** - GitHub username or organization name
- **`GITHUB_REPO`** - Repository name (optional, can be provided in modal)

### How to Get GitHub Token

1. Go to [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
2. Create a new token with these scopes:
   - `read:repo` - Read repository contents
   - `read:user` - Read user profile data
3. Set expiration (90 days recommended, renew as needed)
4. Copy the token
5. Add to Vercel as `GITHUB_TOKEN`

### How to Use in App
- In dashboard connection modal, enter:
  - **Owner**: GitHub username or org name
  - **Repo**: Repository name
- Click "Connect GitHub"
- Validation will test the token and verify access to the repo

---

## 4. Gmail Configuration

### Required Credentials
- **`GMAIL_CLIENT_ID`** - OAuth 2.0 Client ID
- **`GMAIL_CLIENT_SECRET`** - OAuth 2.0 Client Secret
- **`GMAIL_REFRESH_TOKEN`** - OAuth 2.0 Refresh Token

### How to Get Gmail Credentials

#### Step 1: Create OAuth 2.0 Application
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Gmail API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click **Enable**

#### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Desktop application** (or Web if self-hosted)
4. Download the JSON file (keep it safe)
5. Extract:
   - `client_id` → Add to Vercel as `GMAIL_CLIENT_ID`
   - `client_secret` → Add to Vercel as `GMAIL_CLIENT_SECRET`

#### Step 3: Generate Refresh Token
1. Use Google's [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click ⚙️ settings and enable "Use your own OAuth credentials"
3. Paste your `client_id` and `client_secret`
4. In the left panel, find Gmail API and select `https://www.googleapis.com/auth/gmail.readonly`
5. Click **Authorize APIs**
6. Grant permission
7. In the Authorization Code step, click **Exchange authorization code for tokens**
8. Copy the **Refresh Token** from the response
9. Add to Vercel as `GMAIL_REFRESH_TOKEN`

### How to Use in App
- In dashboard connection modal, enter:
  - **Query** (optional): Gmail search filter (e.g., `from:boss@company.com` or `label:important`)
- Leave empty to fetch all emails
- Click "Connect Gmail"
- Validation will test the refresh token and verify access

---

## 5. Vercel Environment Variable Summary

| Variable | Value | Example |
|----------|-------|---------|
| `SLACK_BOT_TOKEN` | Bot token from Slack app | `xoxb-1234567890-1234567890-xxxxx` |
| `GITHUB_TOKEN` | Personal access token from GitHub | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | GitHub username or org | `harshit-personal` |
| `GITHUB_REPO` | Repository name | `ahb26-app` |
| `GMAIL_CLIENT_ID` | OAuth client ID from Google | `123456789-xxxxxxxxxxxxxxx.apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | OAuth client secret from Google | `GOCSPX-xxxxxxxxxxxxxxxxxxxxx` |
| `GMAIL_REFRESH_TOKEN` | Refresh token from OAuth flow | `1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

---

## 6. Testing Connections

After adding credentials to Vercel:

1. **Redeploy** your app (or wait for next auto-deployment)
2. Sign in to dashboard
3. Create/select a workspace
4. Click provider buttons (Slack/GitHub/Gmail)
5. Fill in any required fields (channel IDs, owner/repo, query)
6. Click "Connect [Provider]"
7. See validation success message: ✅ Slack connected. Found X messages.

If you see an error like "channel_not_found", verify:
- The channel exists and is public
- The bot has been added to the channel
- Channel ID format is correct (not display name)

---

## 7. Troubleshooting

### "Token not configured" Error
- Verify you added the credential to Vercel with the correct variable name
- Redeploy after adding environment variables
- Check that the variable is available for the correct environment (Production/Preview/Development)

### "channel_not_found" or Similar Provider Error
- Verify the credential is valid (try generating a new one)
- Verify the resource (channel, repo, email) exists and is accessible
- Verify the token has the required permissions/scopes

### Still Getting 500 Errors
- Check Vercel deployment logs for error details
- Verify `DATABASE_URL` is set (if using database features)
- Try clearing browser cache and reconnecting

---

## 8. Security Best Practices

- **Never commit credentials** to git (use `.env.local` for local development, Vercel env vars for production)
- **Rotate tokens regularly** (especially GitHub personal access tokens)
- **Use minimal scopes** (only request permissions needed for the feature)
- **Review connected apps** periodically in provider settings
- **Revoke tokens** when they're no longer needed

