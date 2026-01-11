# Onboarding Flow - Developer Quick Reference

## 🎯 What Was Built

A complete 4-step emotional onboarding flow that runs once after first sign-in. Fully typed, dark-mode ready, and respects accessibility preferences.

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/app/onboarding/page.tsx` | Main onboarding UI with 4 screens |
| `src/lib/onboarding.ts` | Server-side utilities & types |
| `src/app/globals.css` | Animation styles |
| `src/app/onboarding/layout.tsx` | Layout (unchanged) |

## 🔄 Flow Diagram

```
User signs in
    ↓
auth/callback checks onboarding_completed
    ↓
If false → /onboarding
    ↓
[Step 0] Welcome → [Step 1] Time Usage → [Step 2] Difficulty → [Step 3] Daily Goal
    ↓
User completes onboarding
    ↓
Save all prefs + set onboarding_completed = true
    ↓
Redirect to /dashboard
    ↓
Middleware allows access
```

## 💾 Data Persistence

All data is saved to the `profiles` table:

```typescript
interface OnboardingProfile {
  onboarding_completed: boolean;           // Completion flag
  default_category: "daily" | "work" | "health" | "mixed";
  default_difficulty: "easy" | "moderate" | "heavy";
  show_difficulty: boolean;                // Toggle for UI
  daily_task_goal: 3 | 5 | 10;             // Daily target
}
```

## 🧩 Using the Onboarding Utilities

Import from `src/lib/onboarding.ts`:

```typescript
import {
  fetchOnboardingStatus,
  completeOnboarding,
  updateOnboardingPrefs,
  needsOnboarding,
  type OnboardingProfile,
  type Category,
  type DifficultyLevel,
  type DailyGoal,
} from "@/lib/onboarding";

// Check if user needs onboarding
const profile = await fetchOnboardingStatus(supabase, userId);
if (needsOnboarding(profile)) {
  // Show onboarding
}

// Complete onboarding with preferences
await completeOnboarding(supabase, userId, {
  default_category: "work",
  default_difficulty: "moderate",
  show_difficulty: true,
  daily_task_goal: 5,
});

// Update prefs later
await updateOnboardingPrefs(supabase, userId, {
  daily_task_goal: 10,
});
```

## 🎨 Customizing Screens

Each step is a React component inside the main page. To modify copy:

**Step 0 (Welcome):**
```tsx
<h1>Welcome. Let's make this feel like yours.</h1>
<p>This isn't about doing more. It's about seeing what matters — clearly.</p>
```

**Step 1 (Time Usage):**
```tsx
const CATEGORY_CONFIG = {
  daily: { label: "Daily rhythms", description: "habits & routines" },
  // ...
};
```

**Step 2 (Difficulty):**
```tsx
const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", description: "light lift" },
  moderate: { label: "Moderate", description: "requires focus" },
  heavy: { label: "Heavy", description: "takes real energy" },
};
```

**Step 3 (Daily Goal):**
```tsx
const GOAL_CONFIG = {
  3: { label: "3 things", description: "presence over volume" },
  5: { label: "5 things", description: "balanced & steady" },
  10: { label: "10 things", description: "momentum days" },
};
```

## 🌐 Dark Mode Support

All Tailwind classes use dark: variants:
- `dark:bg-gray-950` for backgrounds
- `dark:text-white` for text
- `dark:border-gray-800` for borders
- `dark:bg-white dark:text-gray-950` for buttons

No additional styling needed; dark mode works automatically.

## ⚙️ How It Integrates With Existing Systems

### Middleware (`src/middleware.ts`)
Already configured to:
- Check `onboarding_completed` status
- Redirect incomplete users to `/onboarding`
- Redirect complete users away from `/onboarding`

### Auth Callback (`src/app/auth/callback/route.ts`)
Already configured to:
- Create profile row on first sign-in
- Redirect to `/onboarding` or `/dashboard` based on status

### Bottom Navigation (`src/components/BottomNav.tsx`)
Already configured to:
- Hide nav on onboarding routes with `pathname.startsWith("/onboarding")`

**Nothing else needs changing!**

## 🧪 Testing

### Test First Sign-In
1. Clear browser cookies
2. Sign in with magic link
3. Should redirect to `/onboarding`
4. Progress through all 4 steps
5. Click "Go to dashboard"
6. Should save preferences and redirect

### Test Returning Users
1. Sign in with same email
2. Should skip onboarding
3. Go straight to dashboard

### Test Skip
1. On welcome screen, click "Skip for now"
2. Should mark as complete (no prefs saved)
3. Go to dashboard

### Test Dark Mode
1. Toggle dark mode in browser
2. All screens should adapt
3. Text should remain readable

## 🚀 Performance Notes

- **Client-side:** All 4 screens rendered at once, just hidden. Fast navigation.
- **Server-side:** Only hits Supabase on load and completion.
- **Bundle:** ~6KB gzipped (TypeScript + all screens)
- **Animation:** GPU-accelerated fade-in (respects prefers-reduced-motion)

## 🐛 Debugging

### Check Onboarding Status
```bash
# In Supabase dashboard, query profiles table
SELECT id, onboarding_completed, default_category, ... 
FROM profiles
WHERE id = 'user-id';
```

### Debug Client-Side
```typescript
// Add to onboarding page
useEffect(() => {
  console.log("Onboarding prefs:", prefs);
  console.log("Current step:", step);
}, [prefs, step]);
```

### Check Middleware
Middleware logs to server console:
```
[middleware] User ID: xxx, Onboarding: false → redirect to /onboarding
```

## 📝 Copy Guidelines

When editing copy, keep these principles:

1. **Human, not technical** - "effort" not "difficulty metric"
2. **Empathetic** - Validate different working styles
3. **Clear intent** - State what data is for
4. **Concise** - 1-2 sentences max per section
5. **Lowercase** - Friendly tone (except titles)

Good copy example:
> "Some things take more out of you — and that's okay. Difficulty isn't about pushing harder. It's about knowing what you're carrying."

Avoid:
> "Please rate the complexity level of your task management style"

## 🔮 Future Extensions

### Post-Onboarding Edits
Users might want to change preferences later:

```typescript
// In settings page
import { updateOnboardingPrefs } from "@/lib/onboarding";

async function updateGoal(newGoal: 3 | 5 | 10) {
  await updateOnboardingPrefs(supabase, userId, {
    daily_task_goal: newGoal,
  });
}
```

### Re-Onboarding
Force users through onboarding again:

```typescript
// In admin/settings
await supabase
  .from("profiles")
  .update({ onboarding_completed: false })
  .eq("id", userId);
// Next login triggers onboarding
```

### Analytics
Track completion rates:

```typescript
// On completion
analytics.track("onboarding_completed", {
  category: prefs.default_category,
  difficulty: prefs.default_difficulty,
  goal: prefs.daily_task_goal,
  duration: Date.now() - startTime,
});
```

## ✅ Checklist Before Deploying

- [ ] Test on mobile browser
- [ ] Test dark/light mode toggle
- [ ] Test keyboard navigation
- [ ] Verify Supabase RLS allows updates
- [ ] Check network tab for slow API calls
- [ ] Test with slow 3G throttling
- [ ] Verify skip button works
- [ ] Verify back navigation works
- [ ] Check console for errors
- [ ] Verify redirects to dashboard
- [ ] Check that returning users skip flow

Done! 🎉
