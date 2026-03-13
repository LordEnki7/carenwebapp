# 🔐 GitHub Deploy Keys Setup Guide

This guide provides multiple options for setting up automated deployment from your GitHub repository to various hosting platforms.

## Option 1: SSH Deploy Keys (Recommended for CI/CD)

### Generate SSH Deploy Key
```bash
# Generate a new SSH key pair specifically for GitHub deployments
ssh-keygen -t ed25519 -C "deploy@carenalert" -f ~/.ssh/github_deploy_key -N ""

# Display the public key to add to GitHub (this is the correct OpenSSH format)
cat ~/.ssh/github_deploy_key.pub

# The output should look like:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx deploy@carenalert
```

**Important:** Make sure you copy the ENTIRE line including:
- `ssh-ed25519` (the key type)
- The long string of characters (the actual key)  
- `deploy@carenalert` (the comment)

**Alternative RSA Key (if ed25519 not supported):**
```bash
# Generate RSA key if ed25519 is not supported
ssh-keygen -t rsa -b 4096 -C "deploy@carenalert" -f ~/.ssh/github_deploy_key_rsa -N ""

# Display RSA public key
cat ~/.ssh/github_deploy_key_rsa.pub
```

### Add to GitHub Repository
1. Go to: https://github.com/LordEnki7/carenalert/settings/keys
2. Click **"Add deploy key"**
3. Title: `C.A.R.E.N. Deploy Key`
4. **Key field:** Paste the COMPLETE public key line (should start with `ssh-ed25519` or `ssh-rsa`)
5. Check **"Allow write access"** (if you need to push from CI/CD)
6. Click **"Add key"**

**Common Issues:**
- ❌ **"Key is invalid"** - Make sure you copied the entire line from the .pub file
- ❌ **Missing key type** - The key must start with `ssh-ed25519` or `ssh-rsa`
- ❌ **Truncated key** - Don't copy just part of the key, copy the complete line
- ✅ **Correct format:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxx...xxx deploy@carenalert`

### Configure SSH for Deployment
```bash
# Add to ~/.ssh/config
Host github-deploy
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy_key
    IdentitiesOnly yes

# Use in git commands
git clone git@github-deploy:LordEnki7/carenalert.git
```

## Option 2: Personal Access Token (Simpler Setup)

### Create GitHub Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `C.A.R.E.N. Platform Deploy Token`
4. Expiration: 1 year (recommended)
5. Select scopes:
   - ✅ `repo` (Full repository access)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)

### Use with HTTPS Git Operations
```bash
# Set remote URL with token
git remote set-url origin https://YOUR_TOKEN@github.com/LordEnki7/carenalert.git

# Or clone with token
git clone https://YOUR_TOKEN@github.com/LordEnki7/carenalert.git
```

### Environment Variable Setup
```bash
# Add to your environment or CI/CD system
export GITHUB_TOKEN=your_personal_access_token_here
```

## Option 3: GitHub Actions Automated Deployment

### Required Repository Secrets
Add these secrets in your GitHub repository settings:

**Go to:** https://github.com/LordEnki7/carenalert/settings/secrets/actions

#### For Heroku Deployment
- `HEROKU_API_KEY` - Your Heroku API key
- `HEROKU_EMAIL` - Your Heroku account email

#### For Railway Deployment  
- `RAILWAY_TOKEN` - Your Railway CLI token

#### For DigitalOcean Deployment
- `DIGITALOCEAN_ACCESS_TOKEN` - Your DigitalOcean API token

#### For Environment Variables (All Platforms)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random session secret (32+ characters)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `GMAIL_USER` - Gmail account for notifications
- `GMAIL_PASS` - Gmail app-specific password

### GitHub Actions Workflow Features
The included `.github/workflows/deploy.yml` provides:

✅ **Automated Testing** - Runs tests on every push/PR  
✅ **Multi-Platform Deployment** - Deploy to Heroku, Railway, DigitalOcean  
✅ **Build Verification** - Ensures code compiles before deployment  
✅ **Environment Management** - Proper secret handling  
✅ **Conditional Deployment** - Only deploys from main branch  

## Option 4: Manual Deploy Commands

### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-caren-app
heroku addons:create heroku-postgresql:essential-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_session_secret
heroku config:set STRIPE_SECRET_KEY=your_stripe_key

# Deploy
git push heroku main
```

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### DigitalOcean App Platform
```bash
# Install doctl CLI
# Configure via web dashboard or CLI
doctl apps create --spec .do/app.yaml
```

## Security Best Practices

### 1. Deploy Key Permissions
- **Read-only keys** for pulling code in production
- **Write access** only for CI/CD systems that need to push

### 2. Token Rotation
- **Rotate tokens** every 6-12 months
- **Use separate tokens** for different environments
- **Monitor token usage** in GitHub settings

### 3. Environment Secrets
- **Never commit secrets** to repository
- **Use platform secret managers** (GitHub Secrets, Heroku Config Vars)
- **Separate staging/production** credentials

### 4. Access Control
- **Limit deploy access** to trusted team members
- **Use branch protection** rules on main branch
- **Require reviews** for deployment-related changes

## Deployment Verification

### Test Deployment Success
```bash
# Verify application is running
curl -I https://your-app.herokuapp.com
curl -I https://your-app.up.railway.app
curl -I https://your-app.ondigitalocean.app

# Check database connectivity
npm run db:check

# Verify essential endpoints
curl https://your-app.com/api/health
curl https://your-app.com/api/demo/status
```

### Monitor Deployment
- **GitHub Actions** - Check workflow runs in Actions tab
- **Platform Dashboards** - Monitor app health in hosting platform
- **Application Logs** - Check server logs for errors
- **Database Status** - Verify PostgreSQL connection and migrations

## Troubleshooting

### Common Issues

#### SSH Key Permission Denied
```bash
# Check SSH agent
ssh-add ~/.ssh/github_deploy_key
ssh -T git@github.com
```

#### Token Authentication Failed
```bash
# Verify token permissions and expiration
# Check repository URL format
git remote -v
```

#### CI/CD Deployment Failures
- Check repository secrets are properly set
- Verify platform API keys are valid
- Review GitHub Actions logs for specific errors

## Next Steps

1. **Choose your preferred method** (SSH keys recommended for security)
2. **Set up repository secrets** for your chosen hosting platform
3. **Test deployment** with a small change
4. **Monitor deployment success** using platform dashboards
5. **Set up monitoring** for production application health

Your C.A.R.E.N. platform is ready for automated deployment with any of these methods!