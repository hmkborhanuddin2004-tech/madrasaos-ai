# MadrasaOS AI - Design System & UI Tokens

## 1. Design Ethos
- **Deep Educational Heritage with Modern SaaS Polish**: Deep emerald greens, warm gold accents used sparingly, and slate neutrals.
- **Zero Decorative Clutter**: No kitschy graphics, no fake domes, no overwhelming arabesque filigree. Modern, crisp typography, clean cards, and deliberate whitespace.
- **Bangladesh-First Accessibility**: Bangla typography (Hind Siliguri / SolaimanLipi) rendered with optimal line-heights (1.6 - 1.8) to prevent ligature clipping. Arabic fonts (Amiri / Scheherazade New) with full RTL shaping.
- **High Information Density where Required**: Financial accounts and examination grade sheets use clean, bordered data grids. Hifz and attendance use large touch-friendly buttons for fast smartphone operation.

---

## 2. Semantic Color Palette

### Light Theme
| Token Name | Hex Value | Usage |
|---|---|---|
| `color-primary` | `#065F46` (Emerald 800) | Primary brand color, main app bars, active tabs, primary buttons |
| `color-primary-dark` | `#044E39` (Emerald 900) | Hover states, brand headers, high-contrast borders |
| `color-primary-light`| `#D1FAE5` (Emerald 100) | Selected item backgrounds, badges, soft highlights |
| `color-secondary` | `#0F766E` (Teal 700) | Secondary navigation, secondary action buttons |
| `color-accent-gold` | `#D97706` (Amber 600) | Attention highlights, Hifz achievements, important notices |
| `color-surface` | `#FFFFFF` | Card surfaces, modals, dropdown panels |
| `color-background` | `#F8FAFC` (Slate 50) | Main application canvas, screen backdrops |
| `color-border` | `#E2E8F0` (Slate 200) | Dividers, card borders, table borders |
| `color-text-primary` | `#0F172A` (Slate 900) | Headings, high-emphasis text, numbers |
| `color-text-secondary`| `#475569` (Slate 600) | Labels, helper descriptions, subheadings |
| `color-text-muted` | `#94A3B8` (Slate 400) | Inactive icons, timestamps, placeholders |
| `color-status-success`| `#10B981` (Green 500) | Present status, paid fees, successful automation |
| `color-status-warning`| `#F59E0B` (Amber 500) | Late attendance, partial fee, pending approval |
| `color-status-error` | `#EF4444` (Red 500) | Absent status, overdue fee, failed execution |
| `color-status-info` | `#3B82F6` (Blue 500) | Informational badges, system updates |

### Dark Theme
| Token Name | Hex Value | Usage |
|---|---|---|
| `color-dark-bg` | `#0B1315` (Dark Slate Green) | Main dark canvas |
| `color-dark-surface` | `#132226` (Muted Deep Teal) | Cards, sidebars, modal surfaces |
| `color-dark-border` | `#1E383D` (Subtle Teal Border) | Borders and separators |
| `color-dark-text` | `#E6F1F2` (Crisp Ice) | Primary text in dark mode |

---

## 3. Typography Tokens
- **Bangla Font Family**: `'Hind Siliguri', 'SolaimanLipi', system-ui, sans-serif`
- **Arabic Font Family**: `'Amiri', 'Traditional Arabic', serif`
- **English/Number Font Family**: `'Inter', 'Plus Jakarta Sans', system-ui, sans-serif`

| Scale | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `display` | 32px / 2.0rem | 1.3 | 700 Bold | Welcome hero banners, KPI large numbers |
| `heading-1` | 24px / 1.5rem | 1.4 | 600 SemiBold | Page titles, major dashboard headers |
| `heading-2` | 20px / 1.25rem | 1.4 | 600 SemiBold | Card titles, section headings |
| `heading-3` | 16px / 1.0rem | 1.5 | 600 SemiBold | Table headers, list item titles |
| `body-large` | 16px / 1.0rem | 1.6 | 400 Regular | Primary body copy, conversational AI text |
| `body-normal`| 14px / 0.875rem | 1.6 | 400 Regular | Data cells, secondary descriptions |
| `caption` | 12px / 0.75rem | 1.5 | 500 Medium | Timestamps, status pills, badge text |

---

## 4. Adaptive Layout Breakpoints
- **Mobile (< 768px)**:
  - Bottom navigation bar with 5 primary anchors: `[Home, Students, Attendance, Finance, More]`.
  - Floating Quick Action Button (`+`) for rapid daily operations.
  - Collapsible full-screen drawer for settings and secondary modules.
- **Tablet (768px - 1024px)**:
  - Collapsible Navigation Rail on left edge.
  - Split two-pane master-detail view for Student Profiles, Hifz Records, and Fee Invoices.
- **Desktop (>= 1024px)**:
  - Permanent Emerald/Slate sidebar with multi-level tree navigation.
  - Top header with Global Universal Command Bar (`⌘K` / `Ctrl+K`), quick branch switcher, notifications center, and user profile.
  - Full three-pane or data grid workspace with sticky action toolbars, live filters, and export controls.
