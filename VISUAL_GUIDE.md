# Visual Guide - History View UI

## Button States & Layout

### Light Mode

```
┌─────────────────────────────────────────────────────┐
│  History                                            │
│  January 2025                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Weekly]  [Monthly]  [Heatmap]  [Yearly]          │
│                                   (selected)        │
│  ──────────────────────────────────────────────────  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  2025 Task Completion                        │  │
│  │  1,247 tasks completed • 365 days in year    │  │
│  │                                              │  │
│  │  January        February       ...           │  │
│  │  ┌────┬────┬────┬────┬────┬────┬────┐        │  │
│  │  │ 2  │ 5  │ 1  │ 0  │ 3  │ 7  │ 2  │ Week 1│  │
│  │  └────┴────┴────┴────┴────┴────┴────┘        │  │
│  │  ┌────┬────┬────┬────┬────┬────┬────┐        │  │
│  │  │ 4  │ 2  │ 6  │ 1  │ 5  │ 3  │ 2  │ Week 2│  │
│  │  └────┴────┴────┴────┴────┴────┴────┘        │  │
│  │  ...                                         │  │
│  │                                              │  │
│  │  Less ■ ■ ■ ■ More                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dark Mode

```
╔═════════════════════════════════════════════════════╗
║  History                                            ║
║  January 2025                                       ║
╠═════════════════════════════════════════════════════╣
║                                                     ║
║  [Weekly]  [Monthly]  [Heatmap]  [Yearly]          ║
║                       (selected)                    ║
║  ══════════════════════════════════════════════════  ║
║                                                     ║
║  ╔──────────────────────────────────────────────╗  ║
║  ║  2025 Task Completion                        ║  ║
║  ║  1,247 tasks completed • 365 days in year    ║  ║
║  ║                                              ║  ║
║  ║  January        February       ...           ║  ║
║  ║  ┌────┬────┬────┬────┬────┬────┬────┐        ║  ║
║  ║  │ 2  │ 5  │ 1  │ 0  │ 3  │ 7  │ 2  │ Week 1║  ║
║  ║  └────┴────┴────┴────┴────┴────┴────┘        ║  ║
║  ║  ┌────┬────┬────┬────┬────┬────┬────┐        ║  ║
║  ║  │ 4  │ 2  │ 6  │ 1  │ 5  │ 3  │ 2  │ Week 2║  ║
║  ║  └────┴────┴────┴────┴────┴────┴────┘        ║  ║
║  ║  ...                                         ║  ║
║  ║                                              ║  ║
║  ║  Less ■ ■ ■ ■ More                          ║  ║
║  ╚──────────────────────────────────────────────╝  ║
║                                                     ║
╚═════════════════════════════════════════════════════╝
```

## Button Styling

### Light Mode (Inactive)
```
┌──────────┐
│ Weekly   │  bg-gray-100, text-gray-700, hover:bg-gray-200
└──────────┘
```

### Light Mode (Active)
```
┌──────────┐
│ Yearly   │  bg-blue-600, text-white, shadow
└──────────┘
```

### Dark Mode (Inactive)
```
┌──────────┐
│ Weekly   │  bg-gray-700, text-gray-200, hover:bg-gray-600
└──────────┘
```

### Dark Mode (Active)
```
┌──────────┐
│ Yearly   │  bg-blue-700, text-white, shadow
└──────────┘
```

## Weekly View Layout

### Desktop (4 columns)
```
┌─────────────────────────────────────────────────────────┐
│  Week View                                              │
│  Jan 6 - Jan 12, 2025                                  │
│  23 tasks completed this week                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Monday   │  │ Tuesday  │  │Wednesday │  │Thursday│ │
│  │ Jan 6    │  │ Jan 7    │  │ Jan 8    │  │ Jan 9 │ │
│  │          │  │          │  │          │  │        │ │
│  │    3     │  │    5     │  │    2     │  │    0   │ │
│  │ tasks    │  │ tasks    │  │ tasks    │  │ tasks  │ │
│  │          │  │          │  │          │  │        │ │
│  │ Light    │  │ Medium   │  │ Light    │  │  No    │ │
│  │ activity │  │ activity │  │ activity │  │ activity│ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Friday   │  │Saturday  │  │ Sunday   │              │
│  │ Jan 10   │  │ Jan 11   │  │ Jan 12   │              │
│  │          │  │          │  │          │              │
│  │    4     │  │    7     │  │    1     │              │
│  │ tasks    │  │ tasks    │  │ tasks    │              │
│  │          │  │          │  │          │              │
│  │ Medium   │  │  High    │  │ Light    │              │
│  │ activity │  │ activity │  │ activity │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tablet (2 columns)
```
┌───────────────────────────────┐
│  Week View                     │
│  Jan 6 - Jan 12               │
│  23 tasks completed this week │
├───────────────────────────────┤
│                               │
│  ┌──────────────┐  ┌────────┐│
│  │ Monday, Jan 6│  │ Tuesday││
│  │          3   │  │     5  ││
│  │ Light        │  │ Medium ││
│  └──────────────┘  └────────┘│
│  ┌──────────────┐  ┌────────┐│
│  │Wednesday,... │  │Thursday││
│  │          2   │  │     0  ││
│  │ Light        │  │  No    ││
│  └──────────────┘  └────────┘│
│  ...                          │
│                               │
└───────────────────────────────┘
```

### Mobile (1 column)
```
┌──────────────────────┐
│  Week View           │
│  Jan 6 - Jan 12      │
│  23 tasks completed  │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ Monday, Jan 6  │  │
│  │            3   │  │
│  │ tasks          │  │
│  │ Light activity │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Tuesday, Jan 7 │  │
│  │            5   │  │
│  │ tasks          │  │
│  │ Medium activity│  │
│  └────────────────┘  │
│  ...                 │
│                      │
└──────────────────────┘
```

## Color Examples

### Activity Colors (Week Cards)

```
0 tasks:  ███████ No Activity       (Gray)
1-2 tasks ███████ Light Activity    (Light Green)
3-4 tasks ███████ Medium Activity   (Medium Green)
5+ tasks  ███████ High Activity     (Dark Green)
```

## Monthly View Example

```
┌──────────────────────────────────────┐
│  January 2025                        │
├──────────────────────────────────────┤
│  Su  Mo  Tu  We  Th  Fr  Sa          │
├─────────────────────────────────────┤
│              1   2   3   4           │
│   5   6   7   8   9  10  11          │
│  12  13  14  15  16  17  18          │
│  19  20  21  22  23  24  25          │
│  26  27  28  29  30  31              │
│                                      │
│  Each cell colored by task count     │
│  Light gray = 0, Light green = 1-2  │
│  Medium green = 3-4, Dark = 5+      │
│                                      │
│  Hover for tooltip: "2025-01-15: 3  │
│  tasks completed"                   │
└──────────────────────────────────────┘
```

## Yearly View Example

```
┌────────────────────────────────────────────────────────┐
│  2025 Task Completion                                  │
│  1,247 tasks completed • 365 days in year              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  January      February     March       ...            │
│  M T W T F S S                                        │
│  ■ ■ ■ ■ ■ ■ □                                        │
│  ■ ■ ■ ■ ■ ■ ■                                        │
│  ■ ■ ■ ■ ■ ■ ■                                        │
│  ■ ■ ■ ■ ■ ■ ■                                        │
│  ■ ■ ■ ■ ■ ■ ■                                        │
│  ■ ■ ■ ■ ■ ■ ■                                        │
│                                                        │
│  Each ■ is one day, colored by intensity             │
│  Hover to see "2025-01-15: 3 tasks"                  │
│                                                        │
│  Less ■ ■ ■ ■ More                                   │
└────────────────────────────────────────────────────────┘
```

## Dark Mode Color Scheme

```
Light Mode              Dark Mode
─────────────────────  ──────────────────────
bg-white               bg-gray-900 (#111)
bg-gray-100            bg-gray-700
text-gray-900          text-white
text-gray-600          text-gray-400
border-gray-200        border-gray-700 (#444)
bg-blue-600            bg-blue-700
shadow-sm              No shadow (less visible)
```

## Responsive Breakpoints

| Screen | WeeklyView | Layout |
|--------|-----------|--------|
| Mobile (< 640px) | 1 column | Full width |
| Tablet (640-1024px) | 2 columns | Max width 90% |
| Desktop (> 1024px) | 4 columns | Max width 6xl |

---

All views maintain consistency in:
- Color scheme (emerald gradient)
- Dark mode support
- Data structure (YYYY-MM-DD: count)
- Accessibility features
