# Emotional Onboarding Flow - Implementation Summary

## Overview
Implemented a 4-step onboarding flow for first-time users with emotional, human-centered design and minimal UI. The flow collects personalization preferences and skips on future logins.

## Features Implemented

### 1. **Welcome Screen** ✅
- **Title:** "Welcome. Let's make this feel like yours."
- **Subtext:** "This isn't about doing more. It's about seeing what matters — clearly."
- **Actions:** Continue or Skip for now
- **Style:** Centered, full-screen, dark theme support

### 2. **How You Use Your Time** ✅
- **Question:** "What does your day usually revolve around?"
- **Options** (single select):
  - Daily rhythms — habits & routines
  - Work & projects — focus & deadlines
  - Health & movement — training & recovery
  - A mix of everything — life isn't one lane
- **Persistence:** `default_category` field on profiles table

### 3. **Effort, Not Pressure** ✅
- **Title:** "Effort, not pressure"
- **Subtext:** Emotional copy about difficulty and effort
- **Options** (single select):
  - Easy — light lift
  - Moderate — requires focus
  - Heavy — takes real energy
- **Toggle:** "Show effort circles in task list" (default on)
- **Persistence:** `default_difficulty` and `show_difficulty` fields

### 4. **What a "Good Day" Means** ✅
- **Question:** "When you look back on a day and feel good — what usually happened?"
- **Options** (single select):
  - 3 things — presence over volume
  - 5 things — balanced & steady
  - 10 things — momentum days
- **CTA:** "Go to dashboard"
- **Persistence:** `daily_task_goal` field

## UI/UX Details

### Layout
- **Full-screen** onboarding layout (no bottom navigation)
- **Centered vertical stack** with max-width container
- **Soft progress dots** (● ○ ○ ○) at the top
- **Back button** available on steps 1-3
- **Skip option** always visible on welcome screen

### Design Tokens
- **Dark background:** `dark:bg-gray-950` with white text
- **Light background:** White with dark text
- **Cards:** Rounded 12px (`rounded-lg`) with subtle borders
- **Border styling:** 2px on selected options, subtle transitions
- **Button states:** Full-width, padding-3, hover:opacity-90 effect
- **Transitions:** Smooth hover and state changes
- **Animations:** fade-in-scale on step transitions (respects prefers-reduced-motion)

### Accessibility
- ✅ Respects `prefers-reduced-motion` preference
- ✅ Semantic HTML with proper labels
- ✅ Color contrast meets WCAG standards
- ✅ Keyboard navigation support
- ✅ Touch-friendly button sizing (48px+ minimum)

## Technical Implementation

### Files Created/Modified
1. **`src/app/onboarding/page.tsx`** - Complete 4-step onboarding flow
   - TypeScript with strict typing (Difficulty, Category, DailyGoal)
   - Supabase client for auth and data persistence
   - Loading state handling
   - Error logging

2. **`src/lib/onboarding.ts`** - Utility functions for onboarding
   - `fetchOnboardingStatus()` - Get user's onboarding state
   - `completeOnboarding()` - Save preferences and mark complete
   - `updateOnboardingPrefs()` - Update prefs without completing
   - `needsOnboarding()` - Check if user needs onboarding
   - Type definitions: `DifficultyLevel`, `Category`, `DailyGoal`, `OnboardingProfile`

3. **`src/app/globals.css`** - Animation styles
   - `@keyframes fadeInScale` - Smooth entrance animation
   - Respects `prefers-reduced-motion` media query

### Database Schema
Uses existing migration (`supabase/migrations/add_onboarding_fields.sql`):
```sql
ALTER TABLE profiles
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN default_category TEXT,
  ADD COLUMN default_difficulty TEXT,
  ADD COLUMN show_difficulty BOOLEAN DEFAULT TRUE,
  ADD COLUMN daily_task_goal INTEGER DEFAULT 5;
```

### Routing Logic
- **Middleware** (`src/middleware.ts`): Routes users to `/onboarding` if `onboarding_completed = false`
- **Auth Callback** (`src/app/auth/callback/route.ts`): Creates profile row and redirects based on onboarding status
- **Bottom Navigation** (`src/components/BottomNav.tsx`): Hidden on onboarding routes
- **Completion:** Setting `onboarding_completed = true` redirects to `/dashboard`

## Data Flow

### Before Onboarding
1. User signs in with magic link
2. `auth/callback/route.ts` creates profile row with defaults
3. Middleware checks `onboarding_completed = false`
4. Redirects to `/onboarding`

### During Onboarding
1. User selects preferences across 4 screens
2. Local state manages selections
3. Progress dots show current step
4. User can navigate back or skip
5. Each action is instant (no saving per-step)

### After Completion
1. User clicks "Go to dashboard"
2. `completeOnboarding()` saves all preferences + `onboarding_completed = true`
3. Router replaces route to `/dashboard`
4. Middleware allows access to app

## Copy & Messaging

### Tone
- **Calm & reassuring** - Not about achievement, about awareness
- **Human-centered** - Acknowledges real life complexity
- **Minimal** - No jargon, clear intent
- **Empathetic** - Validates different working styles

### Key Phrases
- "Let's make this feel like yours" - Personalization focus
- "Seeing what matters — clearly" - Core value
- "Effort, not pressure" - Reframe difficulty
- "Knowing what you're carrying" - Awareness over execution
- "Presence over volume" - Quality over quantity

## Testing Checklist

- [ ] First sign-in shows onboarding (no redirect loop)
- [ ] All 4 steps display correctly
- [ ] Dark mode styling works on all steps
- [ ] Back button navigates correctly
- [ ] Skip jumps to dashboard (no prefs saved)
- [ ] Completion saves all preferences to Supabase
- [ ] Returning users go straight to dashboard
- [ ] Progress dots update with each step
- [ ] Mobile view is responsive
- [ ] Keyboard navigation works
- [ ] Page respects prefers-reduced-motion
- [ ] Error logging captures any issues

## Future Enhancements

- Add step-specific animations (slide up per screen)
- Onboarding completeness percentage
- Edit preferences from settings (post-onboarding)
- A/B test alternative copy/order
- Analytics tracking per step completion
- Multi-language support

## Notes

- No external dependencies added
- Uses existing Supabase setup
- Compatible with existing dark theme system
- Zero impact on existing app functionality
- Auth callback & middleware already handle routing
- Can be skipped without breaking anything
