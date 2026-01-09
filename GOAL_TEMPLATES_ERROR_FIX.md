# Goal Templates: Error Investigation & Fix Summary

## Problem Identified ✓

The `/templates` page was failing with:
```
Failed to load goal templates: {
  code: 'PGRST205',
  message: "Could not find the table 'public.goal_templates' in the schema cache"
}
```

**Root Cause**: Database tables `goal_templates` and `goal_template_tasks` were never created. The migration SQL files existed but weren't applied to the Supabase database.

---

## Solutions Implemented

### 1. Enhanced Error Logging ✓

Improved error messages throughout the application to show complete error details including code, message, hints, and status.

#### Files Updated:

**[src/app/templates/page.tsx](src/app/templates/page.tsx#L27-L36)**
- Changed from: `console.error("Failed to load goal templates:", error)`
- Changed to: Detailed error object with code, message, details, hint, status

```typescript
const errorDetails = {
  code: error.code || 'UNKNOWN',
  message: error.message || 'Unknown error',
  details: (error as any).details || null,
  hint: (error as any).hint || null,
  status: (error as any).status || null,
};
console.error("Failed to load goal templates:", JSON.stringify(errorDetails, null, 2));
```

**[src/app/actions/goal-templates.ts](src/app/actions/goal-templates.ts)**
- `getGoalTemplates()` (lines 11-47): Detailed error logging with full error object
- `getGoalTemplateWithTasks()` (lines 51-111): Separate error logging for template fetch and task fetch
- `applyGoalTemplate()` (lines 169-182): Error logging when inserting tasks fails

All errors now include:
- `code`: Error code (e.g., 'PGRST205')
- `message`: Human-readable message
- `details`: Additional Supabase details
- `hint`: Hints from Supabase (e.g., "Perhaps you meant the table 'public.task_templates'")
- `status`: HTTP status code

---

### 2. Database Setup Guide ✓

Created comprehensive deployment guide: [GOAL_TEMPLATES_DEPLOY.md](GOAL_TEMPLATES_DEPLOY.md)

**Includes**:
- Step-by-step instructions to apply migrations
- Direct Supabase Dashboard URLs
- Exact SQL to copy-paste for RLS policies
- Verification steps
- Troubleshooting table

---

### 3. RLS Security Policies ✓

Created [supabase/migrations/rls_policies_goal_templates.sql](supabase/migrations/rls_policies_goal_templates.sql)

**Policies implemented**:

**goal_templates table**:
- ✅ `Users can select system and own templates`
  - Allows SELECT of templates where `is_system = true` (all users)
  - Allows SELECT of templates where `created_by = auth.uid()` (own templates)
  
- ✅ `Users can insert their own templates`
  - Allows INSERT only for user's own templates (future feature)
  
- ✅ `Users can update their own templates`
  - Allows UPDATE only by template creator

**goal_template_tasks table**:
- ✅ `Users can select tasks from accessible templates`
  - Users can only see tasks from templates they have access to
  - Uses subquery to check parent template permissions

---

### 4. Migration Checking Script ✓

Created [scripts/check-goal-templates.js](scripts/check-goal-templates.js)

**Features**:
- Checks if tables exist in Supabase
- Provides clear guidance if migration needed
- Shows exact dashboard URL and steps
- No external dependencies (uses built-in fetch API)

**Usage**:
```bash
node scripts/check-goal-templates.js
```

**Output when tables exist**:
```
✓ goal_templates table EXISTS
✓ Found 5 templates
✅ Migration already applied!
```

**Output when tables missing**:
```
✗ goal_templates table does NOT exist
❌ Migrations need to be applied
To apply migrations via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard
2. Select project: checklist-log
...
```

---

## Database Setup Steps

### Step 1: Create Schema
1. Go to Supabase Dashboard SQL Editor
2. Copy content from: `supabase/migrations/create_goal_templates.sql`
3. Paste and run

### Step 2: Seed Example Data
1. Create new SQL query
2. Copy content from: `supabase/seed/goal_templates.sql`
3. Paste and run

### Step 3: Set Up RLS Policies
1. Create new SQL query
2. Copy content from: `supabase/migrations/rls_policies_goal_templates.sql`
3. Paste and run

### Step 4: Verify
```bash
node scripts/check-goal-templates.js
npm run dev
# Visit http://localhost:3000/templates
```

---

## Expected Behavior After Setup

### Without RLS Policies (Tables only):
- ⚠️ Templates may load as empty (depends on schema defaults)
- ⚠️ May see "Permission denied" or 403 errors

### With RLS Policies (Full setup):
- ✅ All authenticated users see 5 system templates
- ✅ Users can select individual templates to preview
- ✅ Users can apply templates to get new recurring tasks
- ✅ Applied tasks appear in `/tasks` page
- ✅ No console errors

---

## Files Modified/Created

### Error Logging Improvements
- [src/app/templates/page.tsx](src/app/templates/page.tsx) - Enhanced error reporting
- [src/app/actions/goal-templates.ts](src/app/actions/goal-templates.ts) - Detailed error logging in all functions

### Database Setup
- [supabase/migrations/create_goal_templates.sql](supabase/migrations/create_goal_templates.sql) - Schema (unchanged)
- [supabase/seed/goal_templates.sql](supabase/seed/goal_templates.sql) - Example data (unchanged)
- [supabase/migrations/rls_policies_goal_templates.sql](supabase/migrations/rls_policies_goal_templates.sql) - **NEW: RLS policies**

### Helper Scripts
- [scripts/check-goal-templates.js](scripts/check-goal-templates.js) - **NEW: Migration checker**
- [scripts/apply-goal-templates-migration.js](scripts/apply-goal-templates-migration.js) - **NEW: Migration helper** (for future use)

### Documentation
- [GOAL_TEMPLATES_DEPLOY.md](GOAL_TEMPLATES_DEPLOY.md) - **NEW: Quick deploy guide**
- [GOAL_TEMPLATES_SETUP_GUIDE.md](GOAL_TEMPLATES_SETUP_GUIDE.md) - Detailed setup instructions

---

## Next Steps for User

1. **Apply database migrations** (see steps above) - 5 minutes
2. **Run verification**: `node scripts/check-goal-templates.js`
3. **Restart dev server**: `npm run dev`
4. **Test**: Visit `/templates` and try applying a template
5. **Monitor**: Check browser console and server logs for any remaining issues

---

## Technical Details

### Why PGRST205?
- PostgREST code for "relation not found"
- Occurs when querying a table that doesn't exist
- Common first-time setup issue

### Why RLS Policies Matter
- Without RLS, Supabase may block table access for security
- Policies define who can see/edit what data
- Our policies allow system templates for all users, personal templates for owners

### Error Logging Improvement
- Old: Single line error, loses details
- New: Full error object with code, message, details, hint, status
- Helps diagnose issues faster

---

## Testing Checklist

- [ ] Run migration checker: `node scripts/check-goal-templates.js`
- [ ] Apply create_goal_templates.sql
- [ ] Apply goal_templates.sql seed data
- [ ] Apply rls_policies_goal_templates.sql
- [ ] Restart dev server
- [ ] Visit http://localhost:3000/templates
- [ ] See 5 template cards
- [ ] Click "Preview" on a template
- [ ] Click "Apply" on a template
- [ ] Check /tasks to see new recurring tasks
- [ ] Console shows no PGRST205 errors
