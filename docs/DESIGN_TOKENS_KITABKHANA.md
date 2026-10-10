# MadrasaOS AI v3.0 — "Kitabkhana" Design System & Token Specification

> *"Like opening a centuries-old Islamic manuscript (Kitab) carefully preserved in a library: tactile paper, deep calligraphy ink, natural pigments, and intentional margins."*

This document provides the definitive specification of the **Kitabkhana (কিতাবখানা)** design system, tokens, typography, and components for MadrasaOS AI v3.0.

---

## 1. Core Color Palette

```
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │    Kagoj     │  │     Kali     │  │    Madder    │
  │   #E9E3D5    │  │   #17161A    │  │   #93321F    │
  │  (কাগজ - Base)│  │ (কালি - Ink)  │  │(মঞ্জিষ্ঠা - Alert)│
  └──────────────┘  └──────────────┘  └──────────────┘
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │    Indigo    │  │    Brass     │  │    Slate     │
  │   #1F2A44    │  │   #A87A2E    │  │   #4A4A52    │
  │ (নীল - Binding)│ │ (পিতল - Accent)│ │(শ্লেট - Secondary)│
  └──────────────┘  └──────────────┘  └──────────────┘
```

### 1.1 Token Values & Semantic Roles

| Token Name | Hex Code | Semantic Role | Strict Usage Constraints |
| :--- | :--- | :--- | :--- |
| `--color-kagoj` | `#E9E3D5` | Paper base background | Primary background in light mode; reminiscent of aged handmade rag paper. |
| `--color-kali` | `#17161A` | Primary ink text & structure | Dense carbon-ink for body typography, borders, and structural dividers. Never pure `#000000`. |
| `--color-madder` | `#93321F` | Red ink corrections & alerts | **Errors, rejections, overdue notices, and active focus rings ONLY.** Never used as a background filler. |
| `--color-indigo` | `#1F2A44` | Structural binding & dark base | Bookbinding cloth aesthetic; sidebar backgrounds, top headers, and dark mode surfaces. |
| `--color-brass` | `#A87A2E` | Emblem & metallic accent | Reserved for institutional seals, bookmark markers, and verified badges. |
| `--color-slate-text` | `#4A4A52` | Secondary manuscript text | Quranic verse translation notes, footnotes, timestamps, and metadata. |

---

## 2. Typography Hierarchy & Multilingual Pairing

MadrasaOS AI operates seamlessly across three distinct scripts: **Bengali (Bangla)**, **Arabic**, and **Latin (English)**.

| Script & Function | Primary Font Family | Fallback Stack | Rendering Characteristics |
| :--- | :--- | :--- | :--- |
| **Bengali Body** | `Noto Serif Bengali` | `SolaimanLipi`, serif | High legibility at 15px+, relaxed line height (1.75). |
| **Bengali Display** | `Hind Siliguri` | `system-ui`, sans-serif | Clean, balanced proportions for table headers and KPI cards. |
| **Arabic Text (Quran/Hadith)**| `Amiri` | `Scheherazade New`, serif | Traditional Naskh script styling with full tashkeel vowel fidelity. |
| **Arabic Display/Titles** | `Reem Kufi` | `Amiri`, serif | Architectural geometric Kufic script for Madrasa mastheads. |
| **Latin Body** | `Source Serif 4` | `Georgia`, serif | Elegant bookish roman text for academic transcripts and reports. |
| **Data Grids & Numerical UI**| `Inter Tight` | `Noto Sans Bengali`, sans-serif | Tabular numerals (`font-variant-numeric: tabular-nums`) for marks and currency. |

---

## 3. Manuscript Architectural Motifs

### 3.1 Rub el Hizb (۞) — The Eight-Point Islamic Star
The Rub el Hizb symbol (`۞` / `U+06DE`) is used as a deliberate structural punctuation:
- Demarcates completed chapters in Hifz progress.
- Serves as the central divider between Examination status stages.
- Used as the bulletin mark on Majlis-e-Ilmi approved academic decisions.

### 3.2 Hashiya (হাশিয়া) — Margin Notes
In classic Islamic manuscripts, scholarly annotations and editorial corrections were penned in the outer margins (*Hashiya*).
- **Desktop Layout**: Right-hand 280px margin reserved for teacher commentary, previous exam historical comparisons, and AI agent insights.
- **Card Styling**: Subtle 1px inset border (`rgba(23, 22, 26, 0.12)`) on parchment background (`#FAF8F5`).

---

## 4. Keyboard-First Data Entry Standards

Madrasa ustadhs (teachers) frequently record attendance for 60+ students or submit exam scores for 200+ candidates in single sessions with intermittent internet connectivity.

### 4.1 Universal Keyboard Navigation
- `Tab` / `Shift+Tab`: Forward/reverse cell traversal across the entire tabulation grid.
- `Enter` / `Down Arrow`: Advances to the next student for the same subject.
- `1` / `2` / `3`: Quick shortcut keys in attendance mode (`1` = Present/উপস্থিত, `2` = Absent/অনুপস্থিত, `3` = Leave/ছুটি).
- `Ctrl+S` / `Cmd+S`: Flushes queued offline edits to indexed local cache and attempts server sync.

### 4.2 Focus Floor Constraint
Every interactive element adheres to a mandatory 2px solid Madder (`#93321F`) outline with 2px offset on keyboard focus:
```css
*:focus-visible {
  outline: 2px solid #93321F !important;
  outline-offset: 2px !important;
}
```

---

## 5. UI Component Library Standards

### 5.1 Card Kitab (`.card-kitab`)
Tactile parchment appearance with minimal 2px radius and subtle shadow:
```css
.card-kitab {
  background-color: #FAF8F5;
  border: 1px solid rgba(23, 22, 26, 0.12);
  border-radius: 2px;
  box-shadow: 0 1px 0 rgba(23, 22, 26, 0.08);
}
```

### 5.2 Table Kitab (`.table-kitab`)
High-density ledger styling with dark border accents:
```css
.table-kitab {
  border-collapse: collapse;
  width: 100%;
  border: 1px solid #17161A;
}

.table-kitab th {
  background-color: #E2DBD0;
  color: #17161A;
  font-family: var(--font-bangla-display);
  font-weight: 600;
  border: 1px solid #17161A;
  padding: 0.5rem 0.75rem;
}

.table-kitab td {
  border: 1px solid rgba(23, 22, 26, 0.2);
  padding: 0.5rem 0.75rem;
}
```
