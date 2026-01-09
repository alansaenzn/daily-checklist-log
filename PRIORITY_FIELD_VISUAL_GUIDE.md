Priority Field - Visual Layout
==============================

## Task Creation Form Structure

```
┌─────────────────────────────────────────────┐
│ Task title                                   │
├─────────────────────────────────────────────┤
│ Category: [General ▼]                       │
├─────────────────────────────────────────────┤
│ Task Type:                                  │
│  ◉ Recurring  ○ One-off                    │
├─────────────────────────────────────────────┤
│ ▶ Advanced Options                          │
└─────────────────────────────────────────────┘
```

## When Advanced Options Expanded

```
┌─────────────────────────────────────────────┐
│ ▼ Advanced Options                          │
├─────────────────────────────────────────────┤
│ Notes                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Additional notes...                     │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Priority                                    │
│ ┌──────┬──────┬────────┬──────┐           │
│ │ None │ Low  │ Medium │ High │           │
│ └──────┴──────┴────────┴──────┘           │
├─────────────────────────────────────────────┤
│ URL                                         │
│ ┌─────────────────────────────────────────┐ │
│ │ https://...                             │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Due Date & Time                             │
│ ┌──────────────────┬──────────────────┐    │
│ │ [Date picker]    │ [Time picker]    │    │
│ └──────────────────┴──────────────────┘    │
├─────────────────────────────────────────────┤
│ Project                                     │
│ [Inbox ▼]                                   │
├─────────────────────────────────────────────┤
│ Details                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Additional context or details...        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Priority Button States

### Unselected (Default/None selected)
```
┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐
│ None │ │ Low  │ │ Medium │ │ High │
└──────┘ └──────┘ └────────┘ └──────┘
(Gray)   (Gray)   (Gray)     (Gray)
```

### Selected State (Medium highlighted)
```
┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐
│ None │ │ Low  │ │ Medium │ │ High │
└──────┘ └──────┘ └────────┘ └──────┘
(Gray)   (Gray)   (Orange*)  (Gray)
                  * = filled + border
```

## Color Scheme

### Light Mode
- **None**: Light gray background (#f3f4f6), dark gray text
- **Low**: Light blue background (#dbeafe), blue text (#1e40af)
- **Medium**: Light orange background (#fed7aa), orange text (#c2410c)
- **High**: Light red background (#fecaca), red text (#991b1b)

### Dark Mode
- **None**: Dark gray background (#1f2937), light gray text
- **Low**: Dark blue background (#1e3a8a, 30%), blue text (#93c5fd)
- **Medium**: Dark orange background (#92400e, 30%), orange text (#fdba74)
- **High**: Dark red background (#7f1d1d, 30%), red text (#fca5a5)

## Responsive Behavior

### Desktop (>= 768px)
- All 4 buttons visible in single row
- Equal width distribution
- Full padding

### Tablet (640px - 768px)
- 4 buttons in single row
- Slightly reduced padding
- All content visible

### Mobile (< 640px)
- 4 buttons in single row
- Minimal padding (still touch-friendly)
- Full width container

## Accessibility Features

- All buttons have proper `type="button"` to prevent form submission
- Disabled state clearly indicated
- Sufficient contrast ratios for both light and dark modes
- Clear visual feedback on hover/click
- Hidden input stores value for form submission
- Labels properly associated with controls

## Integration Points

1. **Form Submission**: Priority value passed via FormData
2. **Server Action**: `createTaskTemplate()` receives and validates priority
3. **Database**: Stored as ENUM in `task_templates.priority`
4. **Type Safety**: TypeScript enforces valid priority values
5. **Backward Compatibility**: Defaults to "none" for old tasks
