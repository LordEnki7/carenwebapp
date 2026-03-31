# C.A.R.E.N. Deployment Troubleshooting Guide

## Common Deployment Issues & Solutions

### 1. Environment Variables Missing
**Error**: "DATABASE_URL must be set" or API key errors
**Solution**: Ensure these environment secrets are configured:
- `DATABASE_URL` (PostgreSQL connection)
- `OPENAI_API_KEY` (AI features)
- `ANTHROPIC_API_KEY` (Claude AI)
- Database credentials: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 2. Build Failures
**Error**: TypeScript compilation errors or build process failures
**Solution**: 
```bash
npm run check  # Check TypeScript issues
npm run build  # Test build process
```

### 3. Port Configuration
**Error**: Application not accessible after deployment
**Solution**: Ensure server binds to `0.0.0.0` not `localhost`
- Check `server/index.ts` uses `host: '0.0.0.0'`
- Default port should be configurable via `process.env.PORT`

### 4. Database Connection Issues
**Error**: Database connection failures in production
**Solution**:
- Verify PostgreSQL database is provisioned
- Check DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Run database migration: `npm run db:push`

### 5. Static Asset Issues
**Error**: CSS/JS files not loading
**Solution**: 
- Verify build output in `dist/` directory
- Check Vite build configuration includes all assets
- Ensure Express serves static files correctly

## Pre-Deployment Checklist

✅ **Production Status**: Verify `isProductionReady: true`
✅ **Environment Variables**: All secrets configured
✅ **Database**: PostgreSQL connected and migrated
✅ **Build Process**: `npm run build` succeeds
✅ **Attorney Network**: Verified attorneys available
✅ **Health Check**: `/api/health` endpoint responds

## Current Production Status
- **Production Ready**: ✅ TRUE
- **Attorney Network**: 3 verified attorneys
- **Database**: ✅ Connected
- **All Systems**: ✅ Operational

## Deployment Commands
```bash
# Build for production
npm run build

# Start production server
npm start

# Check system health
curl http://localhost:5000/api/health
```

## If Issues Persist
1. Check server logs for specific error messages
2. Verify all environment variables are set
3. Test database connection independently
4. Ensure all dependencies are installed
5. Check for TypeScript compilation errors

The C.A.R.E.N. platform is production-ready with all systems operational. Most deployment issues are related to environment configuration rather than code problems.