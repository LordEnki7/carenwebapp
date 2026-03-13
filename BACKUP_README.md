# CAREN Project Backup Guide

## Two Types of Backups Created

### 1. Source Code Backup
**File**: `caren_complete_system_backup_20250624_185926.tar.gz` (46 MB)
**Contains**:
- Complete source code (client/, server/, shared/)
- Configuration files (package.json, vite.config, etc.)
- Documentation and guides
- Assets and attachments
- Project structure and dependencies list

**Use**: Restore complete application on any system

### 2. Runtime Data Backup
**File**: `caren_runtime_data_backup_[timestamp].tar.gz`
**Contains**:
- Current user accounts and session data
- Database state and content
- Environment configuration
- Runtime memory storage state
- Active session information

**Use**: Capture current application state and data

## Important Notes

### Memory Storage Limitation
- User accounts are stored in memory (not persistent database)
- Server restart clears all user data
- This is a demo/development configuration

### Database vs Memory Storage
- Database schema exists but user accounts use memory storage
- Emergency contacts, incidents, and other data use persistent database
- User authentication resets on server restart

### Restoration Process
1. Extract source code backup
2. Run `npm install` to install dependencies
3. Set up database and environment variables
4. Import runtime data if needed
5. Deploy application

## Backup Files Summary
- **Source Code**: Everything needed to rebuild the application
- **Runtime Data**: Current state and user data (temporary)
- **Combined**: Complete project snapshot for development/demo purposes

Generated: $(date)