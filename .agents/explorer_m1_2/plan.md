# Implementation Strategy Plan: Milestone 1 Frontend UI
**MadrasaOS AI v3.0 — Segregated Accounting, Donations & Daily Cash Book**
**Document Version:** 1.0.0  
**Author:** Codebase Explorer (teamwork_preview_explorer / explorer_m1_2)  
**Target Recipient:** Orchestrator (orchestrator_1) & Lead Frontend Engineer  

---

## 1. Executive Summary & Objectives

Milestone 1 establishes the core accounting integrity of MadrasaOS AI v3.0, solving the critical real-world requirement of Bangladeshi madrasas: **strict fund segregation and ring-fenced financial ledgers**. In traditional madrasas, cross-fund leakage between poor orphan funds (Zakat/Lillah) and general institutional tuition or construction funds is strictly prohibited by Shariah governance and audit rules.

This frontend strategy outlines the exact blueprints, component hierarchies, state machines, and UX interactions for:
1. **Redesigning & Enhancing `FinanceScreen.tsx`** with segregated tabs:
   - **Tab 1: All Invoices (সকল চালান ও সারসংক্ষেপ)** — Master view with ledger indicators, filters, and high-level KPIs.
   - **Tab 2: Residential Ledgers (আবাসিক লেজার: খোরাকি, সিট, মেস, লন্ড্রি/ইউটিলিটি)** — Ring-fenced hostel ledger with specific fee item presets and residential invoice creation.
   - **Tab 3: Non-Residential Ledgers (অনাবাসিক লেজার: মাসিক বেতন, সেশন, পরীক্ষা)** — Academic tuition ledger with specific fee presets and academic invoice creation.
   - **POS Fee Collection Modal** with multi-channel payment methods, duplicate transaction ID conflict guard (HTTP 409 Conflict banner), and serialized print voucher.
2. **Designing `DonationsScreen.tsx`**:
   - **Ring-Fenced Fund Cards** for (a) Lillah Boarding & Orphan Fund (লিল্লাহ বোর্ডিং ও এতিম তহবিল), (b) General Operational Fund (সাধারণ তহবিল), and (c) Construction & Waqf Fund (ভবন নির্মাণ ও ওয়াকফ তহবিল).
   - **Donor Registry Table** filtering Permanent (আজীবন), Annual (বার্ষিক), and One-time/Anonymous (এককালীন ও বেনামী) donors with WhatsApp communication triggers.
   - **New Donation Modal** generating an immutable official **Printable Credit Voucher (মানি রিসিট)** with serialized receipt numbers, Bengali words conversion, and dual authorized signature slots.
   - **Register Donor Modal** for capturing ongoing recurring commitments.
3. **Designing `CashBookScreen.tsx`**:
   - **Daily Automated Cash Book** calculating the fundamental accounting equation:
     $$\text{সমাপনী ক্যাশ} = \text{প্রারম্ভিক ক্যাশ} + \text{নগদ আদায়} - \text{নগদ ব্যয়} - \text{ব্যাংকে জমা}$$
   - **Interactive Date Picker** allowing historical inspection of daily books with quick date jump buttons (আজ, গতকাল).
   - **Dual-Side Ledger Breakdown** (Debit Inflows vs. Credit Outflows & Bank Deposits).
   - **Bank Deposit Slip Modal** for logging drawer cash deposits into institutional bank accounts.
   - **Printable End-of-Day Register** for physical signing by Accountant and Muhtamim.
4. **App Navigation & Routing Integration**:
   - Seamless integration in `App.tsx`, `Sidebar.tsx`, `CommandPalette.tsx`, `AccountantDashboard.tsx`, and `translations.ts`.

---

## 2. Architecture & File Layout

```
client/src/
├── App.tsx                                        [Modified: routes for 'donations', 'cash_book']
├── components/
│   ├── common/
│   │   ├── Sidebar.tsx                           [Modified: navigation items for accountant & admin]
│   │   ├── CommandPalette.tsx                    [Modified: quick actions & AI queries for donations & cashbook]
│   │   └── Navbar.tsx                            [Verified: already supports responsive triggers]
│   ├── dashboard/
│   │   └── AccountantDashboard.tsx               [Modified: quick action cards for donations & cashbook]
│   ├── modules/
│   │   ├── FinanceScreen.tsx                     [Modified: 3-tab segregated ledger & enhanced POS]
│   │   ├── DonationsScreen.tsx                   [NEW: Ring-fenced funds, donor registry, voucher modal]
│   │   └── CashBookScreen.tsx                    [NEW: Daily cash book, date picker, bank deposit modal]
│   └── print/                                    [Sub-components or modals for print vouchers]
├── i18n/
│   └── translations.ts                           [Modified: Bengali/English/Arabic translation tokens]
```

---

## 3. Detailed Specification: `FinanceScreen.tsx` Redesign

### 3.1 Tab Navigation Architecture
Replace the single flat list with a 3-tab segmented layout:
```tsx
type FinanceTab = 'all' | 'residential' | 'non_residential';
const [activeTab, setActiveTab] = useState<FinanceTab>('all');
```

- Visual Design: Sticky pill/segment navigation with badge counters:
  - **সকল চালান ও সারসংক্ষেপ** (Icon: `Receipt`, count badge)
  - **আবাসিক লেজার (হোস্টেল ও মেস)** (Icon: `Bed`, ring-fence shield badge)
  - **অনাবাসিক লেজার (একাডেমিক ফি)** (Icon: `GraduationCap`, academic book badge)

### 3.2 Tab 1: All Invoices (সকল চালান ও সারসংক্ষেপ)
- **Top Financial KPI Cards**:
  1. মোট বিলকৃত ফি (Total Invoiced Amount)
  2. আদায়কৃত মোট অর্থ (Total Collected Amount) + আজকের আদায় সাব-টেক্সট
  3. মোট বকেয়া ফি (Total Overdue/Due Amount)
  4. প্রাতিষ্ঠানিক মোট ব্যয় (Total Expenses)
- **Filters & Actions**:
  - Status Filter: `সকল চালান` | `বকেয়া তালিকা` | `পরিশোধিত`
  - Action buttons:
    - "খরচের ভাউচার এন্ট্রি" (Expense Voucher Entry)
    - "নতুন সাধারণ চালান তৈরি" (Generate Invoice)
- **Table Columns**:
  - চালান নং (Invoice Number)
  - লেজার টাইপ (Badge: 🛏️ আবাসিক [Teal] vs 🎓 অনাবাসিক [Blue])
  - শিক্ষার্থীর নাম ও আইডি (Student Name BN + Roll + ID)
  - শ্রেণি ও অভিভাবক ফোন (Class + Phone)
  - মোট পরিমাণ (Total Amount ৳)
  - আদায়কৃত (Paid Amount ৳)
  - বকেয়া (Due Amount ৳)
  - স্ট্যাটাস (Status: পরিশোধিত [Emerald] / বকেয়া [Red] / আংশিক [Amber])
  - পদক্ষেপ (Action: "ফি আদায় (POS)" button)

### 3.3 Tab 2: Residential Ledgers (আবাসিক লেজার: খোরাকি, সিট, মেস, লন্ড্রি/ইউটিলিটি)
- **Strict Ring-Fencing Notice Banner**:
  - Background: `bg-teal-50 border-teal-200 text-teal-900`
  - Text: *"🛡️ আবাসিক ছাত্রাবাস লেজার — এই লেজারের সকল খোরাকি, সিট ও মেস আদায়ের অর্থ পৃথক ছাত্রাবাস ফান্ডে সংরক্ষিত হয়। সাধারণ একাডেমিক ফান্ডের সাথে কোনো প্রকার মিশ্রণ অনুমোদিত নয়।"*
- **Residential Mini KPI Row**:
  - আবাসিক মোট বিল (Residential Billed)
  - আবাসিক আদায় (Residential Collected)
  - আবাসিক বকেয়া (Residential Due)
- **Quick Preset Badges**:
  - Filter by fee item category: `সকল আবাসিক ফি` | `মাসিক খোরাকি` | `সিট ভাড়া` | `লন্ড্রি ও ইউটিলিটি` | `চিকিৎসা সাহায্য`
- **Actions**:
  - "নতুন আবাসিক চালান তৈরি" (Opens `CreateInvoiceModal` preset to `ledger_type: 'residential'`)
- **Table Data**:
  - Filters `invoices.filter(i => i.ledger_type === 'residential')` or calls `GET /api/v1/finance/invoices?type=residential`.
  - Column displays parsed fee items chips (e.g. `খোরাকি: ৳৩,০০০`, `সিট: ৳৮০০`, `বিদ্যুৎ: ৳২০০`).

### 3.4 Tab 3: Non-Residential Ledgers (অনাবাসিক লেজার: মাসিক বেতন, সেশন, পরীক্ষা)
- **Academic Fund Notice Banner**:
  - Background: `bg-blue-50 border-blue-200 text-blue-900`
  - Text: *"📚 অনাবাসিক একাডেমিক লেজার — কিতাব বিভাগ, নূরানী ও হিফজ ডে-কেয়ারের মাসিক বেতন, সেশন ফি ও পরীক্ষার ফি এই লেজারে পরিচালিত হয়।"*
- **Non-Residential Mini KPI Row**:
  - একাডেমিক মোট বিল (Academic Billed)
  - একাডেমিক আদায় (Academic Collected)
  - একাডেমিক বকেয়া (Academic Due)
- **Quick Preset Badges**:
  - Filter by fee item category: `সকল একাডেমিক ফি` | `মাসিক বেতন` | `সেশন ফি` | `পরীক্ষার ফি` | `পরিবহন ফি`
- **Actions**:
  - "নতুন একাডেমিক চালান তৈরি" (Opens `CreateInvoiceModal` preset to `ledger_type: 'non_residential'`)
- **Table Data**:
  - Filters `invoices.filter(i => i.ledger_type === 'non_residential')` or calls `GET /api/v1/finance/invoices?type=non_residential`.
  - Column displays parsed fee items chips (e.g. `মাসিক বেতন: ৳১,২০০`, `পরীক্ষা ফি: ৳৫০০`).

### 3.5 POS Fee Collection Modal Enhancements
- **Inputs**:
  - Selected Invoice summary: Student name, class, invoice number, due amount.
  - Payment method selector: `bKash` (pink), `Nagad` (orange), `Rocket` (purple), `নগদ ক্যাশ` (emerald), `ব্যাংক জমা` (blue).
  - Amount input (defaults to full due, supports partial).
  - Transaction ID input: Active for non-cash methods with placeholder `"যেমন: TrxID বা ব্যাংক স্লিপ নং"`.
- **Duplicate Transaction ID & HTTP 409 Conflict Handling**:
  - Catches HTTP 409 Conflict from backend:
  - Error state displays an alert box:
    ```tsx
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
      <span>এই ট্রানজেকশন আইডি ইতিপূর্বে ব্যবহার করা হয়েছে! দ্বৈত এন্ট্রি প্রতিরোধ করা হয়েছে।</span>
    </div>
    ```
- **Post-Payment Success & Printable Receipt Modal**:
  - Displays green checkmark, generated Payment Receipt Number (`REC-2026-09-xxxx`), paid amount, and remaining due.
  - Button: "🖨️ ডিজিটাল রসিদ প্রিন্ট করুন" — Opens printable official receipt with QR code placeholder, Bismillah header, student metadata, payment channel reference, and cashier signature stamp.

### 3.6 Create Invoice Modal (`CreateInvoiceModal`)
- Modal opens from either Tab 1, Tab 2, or Tab 3:
  - Student Selector: Searchable dropdown listing active students.
  - Ledger Type: Radio toggle between `আবাসিক (Residential)` and `অনাবাসিক (Non-Residential)`.
  - Month & Year: Current month default (`সেপ্টেম্বর ২০২৬`).
  - Due Date: Date picker (default: 10th of current/next month).
  - Dynamic Line Items Builder:
    - Pre-populated chips depending on ledger type:
      - *Residential:* `[+ মাসিক খোরাকি ৳৩০০০]`, `[+ সিট ভাড়া ৳৮০০]`, `[+ ইউটিলিটি ৳২০০]`, `[+ লন্ড্রি ৳৩০০]`.
      - *Non-Residential:* `[+ মাসিক বেতন ৳১২০০]`, `[+ পরীক্ষা ফি ৳৫০০]`, `[+ সেশন ফি ৳১০০০]`, `[+ পরিবহন ৳৮০০]`.
    - Custom item row: Title and Amount with "আইটেম যোগ করুন" button.
    - Real-time Total Calculation.
  - Calls `POST /api/v1/finance/invoices`.

---

## 4. Detailed Specification: `DonationsScreen.tsx`

### 4.1 Component Purpose & Role Scope
- Role Permissions: `madrasa_admin`, `principal`, `accountant`, `super_admin`.
- URL / Tab ID: `'donations'`.

### 4.2 Top Header & Actions
- Title: **দান, অনুদান ও ওয়াকফ তহবিল ব্যবস্থাপনা**
- Subtitle: *মাদ্রাসার লিল্লাহ বোর্ডিং ও এতিম তহবিল, সাধারণ তহবিল এবং ওয়াকফ ও ভবন নির্মাণ তহবিলের পৃথক সংরক্ষণ*
- Action Buttons:
  1. `[+ নতুন অনুদান গ্রহণ (POS)]` — Triggers `NewDonationModal`
  2. `[+ নতুন দাতা নিবন্ধন]` — Triggers `RegisterDonorModal`

### 4.3 Three Ring-Fenced Fund Summary Cards
```
+---------------------------------------------------------------------------------------+
| 1. লিল্লাহ বোর্ডিং ও এতিম তহবিল      | 2. সাধারণ প্রাতিষ্ঠানিক তহবিল | 3. ভবন নির্মাণ ও ওয়াকফ তহবিল |
| [Strictly Ring-Fenced] 🛡️         | [সাধারণ পরিচালনা] 🏢         | [স্থায়ী ওয়াকফ ও জমি] 🕌     |
| খাত: যাকাত, ফিতরা, চামড়া, ছদকা    | খাত: বিদ্যুৎ, মেরামত, অফিস  | খাত: বহুতল ভবন, মসজিদ       |
| মোট সংগ্রহ: ৳৪,৮৫,০০০             | মোট সংগ্রহ: ৳২,১৫,০০০        | মোট সংগ্রহ: ৳১২,৫০,০০০       |
| ব্যালেন্স: ৳১,৯২,৫০০ অবশিষ্ট      | ব্যালেন্স: ৳৫৮,৪০০ অবশিষ্ট   | ব্যালেন্স: ৳৭,২০,০০০ অবশিষ্ট|
+---------------------------------------------------------------------------------------+
```
- Each card displays:
  - Shield / Ring-Fence warning label.
  - Permitted Shariah expenditures (যেমন: লিল্লাহ তহবিলের অর্থ কেবলমাত্র দরিদ্র/এতিম ছাত্রদের খোরাকি ও পোশাকে ব্যয়যোগ্য).
  - Total collected this fiscal year, total disbursed, current available balance.
  - "দান করুন" quick trigger button pre-selecting that fund.

### 4.4 Donor Registry Table
- **Tabs**:
  - `সকল দাতা (All Donors)`
  - `আজীবন দাতা (Permanent Donors)` — Donors with lifetime membership / large endowments.
  - `বার্ষিক দাতা (Annual Donors)` — Recurring yearly donors (e.g. Ramadan commitments).
  - `এককালীন ও বেনামী (One-time & Anonymous)` — Friday collections, general donors.
- **Search & Filters**:
  - Input: Search by donor name, phone number, organization name.
  - Fund Filter: All Funds | Lillah Fund | General Fund | Waqf Fund.
- **Table Columns**:
  1. দাতার নাম ও প্রতিষ্ঠান (Donor Name & Organization)
  2. ধরন (Category Badge: আজীবন দাতা [Purple] / বার্ষিক [Teal] / এককালীন [Slate] / বেনামী [Amber])
  3. মোবাইল ও হোয়াটসঅ্যাপ (Phone & WhatsApp link: `https://wa.me/8801...` with WhatsApp icon)
  4. টার্গেট তহবিল (Preferred Fund: লিল্লাহ / সাধারণ / ওয়াকফ)
  5. মোট অনুদান (Total Contributed ৳)
  6. শেষ অনুদানের তারিখ ও রসিদ (Last Donation Date & Receipt No)
  7. অঙ্গীকার ফ্রিকোয়েন্সি (Commitment Frequency: মাসিক ৳৫,০০০ / বার্ষিক ৳৫০,০০০)
  8. পদক্ষেপ (Actions: "অনুদান গ্রহণ" & "ভাউচার ইতিহাস")

### 4.5 New Donation Receipt Modal (`NewDonationModal`)
- **Fields**:
  - **Donor Selection**:
    - Dropdown with autocomplete search from registered donors OR toggle `[+ এককালীন/বেনামী দাতা]`.
    - If new/anonymous: Name, Phone, Address fields appear.
  - **Fund Target Selection (Radio Cards)**:
    - 🟢 **লিল্লাহ বোর্ডিং ও এতিম তহবিল** (যাকাত, ফিতরা, চামড়া, ছদকা) — Alert: *"এই অর্থ শুধুমাত্র এতিম ও দরিদ্র আবাসিক শিক্ষার্থীদের প্রয়োজনে ব্যয় হবে।"*
    - 🔵 **সাধারণ প্রাতিষ্ঠানিক তহবিল** (বিদ্যুৎ, মেরামত, সাধারণ উপহার)
    - 🟣 **ভবন নির্মাণ ও ওয়াকফ তহবিল** (বহুতল ভবন সম্প্রসারণ, মসজিদ ওয়াকফ)
  - **Donation Sub-Type**: Dropdown (`যাকাত`, `ফিতরা`, `কুরবানির চামড়া`, `নফল ছদকা`, `সাধারণ অনুদান`, `নির্মাণ অনুদান`, `ওয়াকফ সম্পত্তি`).
  - **Amount (টাকা)**: Numeric input.
  - **Payment Method**: নগদ ক্যাশ (Cash), ব্যাংক ডিপোজিট (Bank Transfer), বিকাশ (bKash), নগদ (Nagad), চেক (Cheque).
  - **Transaction / Cheque / Slip No**: String input.
  - **Du'a & Remarks (দোয়া ও মন্তব্য)**: e.g. *"মরহুম পিতা-মাতার মাগফিরাত কামনায়"*.
- **Submission Workflow**:
  - Calls `POST /api/v1/finance/donations/receipts`.
  - Backend returns `{ success: true, data: { receiptNo: 'DON-2026-09-0024', ... } }`.
  - Displays the **Printable Credit Voucher**.

### 4.6 Printable Credit Voucher (মানি রিসিট ও জমা ভাউচার)
Designed as an authentic Bangladeshi Madrasa receipt:
```
+--------------------------------------------------------------------------+
|                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ                      |
|                     দারুল উলূম সেন্ট্রাল মাদ্রাসা                        |
|       মিরপুর-১০, ঢাকা-১২১৬ • ফোন: ০১৭১১১১১১১১ • স্থাপিত: ১৯৯৮ ইং       |
|                 -----------------------------------------                |
|                    অফিসিয়াল দান ও অনুদান জমা রসিদ                        |
|                                                                          |
| রসিদ নং: DON-2026-09-0024                  তারিখ: ২০ সেপ্টেম্বর ২০২৬ ইং  |
|                                            হিজরী: ৫ রবিউল আউয়াল ১৪৪৮     |
|                                                                          |
| দাতার নাম: আলহাজ্ব মুহাম্মদ শামসুল হক          মোবাইল: ০১৮১১২২৩৩৪৪       |
| প্রতিষ্ঠানের নাম: হক এন্টারপ্রাইজ               ঠিকানা: ধানমন্ডি, ঢাকা      |
| তহবিলের নাম: [ লিল্লাহ বোর্ডিং ও এতিম তহবিল (যাকাত) ]                    |
|                                                                          |
| গৃহীত অর্থ: ৳ ৫০,০০০.০০                                                   |
| কথায়: পঞ্চাশ হাজার টাকা মাত্র।                                           |
| আদায়ের মাধ্যম: ব্যাংক ডিপোজিট (ইসলামী ব্যাংক - স্লিপ নং: IBBL-982103)      |
| দোয়া ও মন্তব্য: মরহুম পিতার ইসালে সওয়াবের উদ্দেশ্যে।                     |
|                                                                          |
|  ......................                      ..........................  |
|     আদায়কারীর স্বাক্ষর                           মুহতামিম / হিসাবরক্ষক    |
| (মুহাম্মদ ফারুক হোসেন)                           (মাওলানা আব্দুল কুদ্দুস)    |
+--------------------------------------------------------------------------+
```
- Includes a `"রসিদ প্রিন্ট করুন (Print Voucher)"` button invoking `window.print()` targeting a print-isolated CSS class.

---

## 5. Detailed Specification: `CashBookScreen.tsx`

### 5.1 Component Purpose & Role Scope
- Role Permissions: `accountant`, `madrasa_admin`, `principal`, `super_admin`.
- URL / Tab ID: `'cash_book'`.

### 5.2 Top Header & Interactive Date Picker
- Header: **দৈনিক স্বয়ংক্রিয় ক্যাশ বই ও ব্যাংক হিসাব (Daily Automated Cash Book)**
- Subtitle: *প্রতিদিনের নগদ প্রাপ্তি, খরচ, ব্যাংকে জমা এবং দিনান্তের সমাপনী উদ্বৃত্তের স্বয়ংক্রিয় খতিয়ান*
- Date Picker Controller:
  - Date input: `value={selectedDate}` (`YYYY-MM-DD`).
  - Quick action buttons:
    - `[আজ (Today)]` — jumps to `2026-09-20`.
    - `[গতকাল (Yesterday)]` — jumps to `2026-09-19`.
    - `[চলতি মাসের ১ তারিখ]` — jumps to `2026-09-01`.
  - Actions:
    - `[+ ব্যাংকে নগদ জমা ভাউচার]` — Opens `BankDepositModal`.
    - `[🖨️ আজকের ক্যাশ বই প্রিন্ট]` — Triggers daily cash book print layout.

### 5.3 Five Financial Metrics (Accounting Golden Equation)
```tsx
const closingBalance = openingBalance + cashCollections - cashExpenses - bankDeposits;
```
1. **প্রারম্ভিক নগদ ক্যাশ (Opening Balance)**:
   - গতকালের ক্যাশ বাক্স থেকে সমাপনী ক্যাশ হস্তান্তরিত।
   - Example: ৳২৪,৫০০.
2. **আজকের মোট নগদ আদায় (+) (Daily Cash Collections)**:
   - ছাত্র বেতন (নগদ) + দান ও অনুদান (নগদ) + বিবিধ।
   - Example: ৳৩৮,২০০.
3. **আজকের মোট নগদ খরচ (-) (Daily Cash Expenses)**:
   - মেস খানা বাজার + বিদ্যুৎ + জরুরি মেরামতের নগদ বিল।
   - Example: ৳১২,০০০.
4. **ব্যাংক একাউন্টে জমা (-) (Deposited into Bank)**:
   - ক্যাশ বাক্স থেকে ব্যাংকে পাঠানো নগদ অর্থ।
   - Example: ৳৩০,০০০.
5. **সমাপনী নগদ ব্যালেন্স (=) (Closing Cash in Hand)**:
   - সমাপনী ক্যাশ = ৳২৪,৫০০ + ৳৩৮,২০০ - ৳১২,০০০ - ৳৩০,০০০ = **৳২০,৭০০**.
   - Balanced status badge: `🟢 ক্যাশ বাক্স হিসাব শতভাগ মিল রয়েছে (Audit Verified)`.

### 5.4 Dual-Side Daily Ledger View (Debit vs Credit)
Two side-by-side or stacked responsive cards:
- **বাম পাশ: নগদ জমা ও আদায় (Debit Side / Cash Inflows)**:
  - Header: মোট নগদ প্রাপ্তি: ৳৩৮,২০০
  - Table Columns:
    - সময় (Time, e.g. ১০:৩০ AM)
    - জমার খাত ও বিবরণ (Fee collection, Lillah Zakat donation, General donation)
    - রসিদ নম্বর (Voucher/Receipt No, e.g. `REC-2026-09-0012`, `DON-2026-09-0005`)
    - জমাদানকারী (Student / Donor Name)
    - পরিমাণ (Amount ৳)
- **ডান পাশ: নগদ খরচ ও ব্যাংকে জমা (Credit Side / Outflows & Bank Deposits)**:
  - Header: মোট নগদ বহির্গমন: ৳৪২,০০০ (ব্যয় ৳১২,০০০ + ব্যাংক জমা ৳৩০,০০০)
  - Table Columns:
    - সময় (Time, e.g. ১২:১৫ PM)
    - ব্যয়ের খাত / ব্যাংক বিবরণ (Food ration, utility, or Bank deposit slip)
    - ভাউচার নম্বর (Voucher No / Deposit Slip No)
    - প্রাপক / ব্যাংক একাউন্ট (Supplier name or Bank branch)
    - পরিমাণ (Amount ৳)

### 5.5 Linked Bank Accounts Sub-Panel
Displays active institutional bank accounts with current balances:
1. **আল-আরাফাহ ইসলামী ব্যাংক লিমিটেড**
   - একাউন্ট নং: `0121020034921` (মিরপুর শাখা)
   - চলতি জমা ব্যালেন্স: ৳৪,৮৫,০০০
2. **ইসলামী ব্যাংক বাংলাদেশ পিএলসি**
   - একাউন্ট নং: `20501840100902` (পল্লবী শাখা)
   - চলতি জমা ব্যালেন্স: ৳৯,২০,০০০

### 5.6 Bank Deposit Voucher Modal (`BankDepositModal`)
- Fields:
  - Available drawer cash indicator: `বর্তমান ক্যাশ বাক্সে অবশিষ্ট: ৳৫০,৭০০`
  - Bank Account Selection (dropdown of active accounts)
  - Deposit Slip Number (ব্যাংক জমা স্লিপ নং, required)
  - Amount (টাকা, validated against available drawer cash)
  - Depositor Name (কে ব্যাংকে টাকা জমা দিয়েছেন, e.g. Muhammad Faruq Hossain, Accountant)
  - Branch & Date
  - Notes / বিবরণ
- On Submit:
  - Calls `POST /api/v1/finance/cash-book/bank-deposit`.
  - Automatically deducts from cash on hand and credits the bank account ledger.

---

## 6. App Navigation & System Integration

### 6.1 `App.tsx` Integration
1. **Importing Modules**:
   ```tsx
   import { FinanceScreen } from './components/modules/FinanceScreen';
   import { DonationsScreen } from './components/modules/DonationsScreen';
   import { CashBookScreen } from './components/modules/CashBookScreen';
   ```
2. **Route Switching in `renderContent()`**:
   ```tsx
   switch (activeTab) {
     // ... existing tabs ...
     case 'finance':
       return <FinanceScreen />;
     case 'donations':
       return <DonationsScreen />;
     case 'cash_book':
       return <CashBookScreen />;
     // ...
   }
   ```
3. **Role Guards**:
   Ensure `teacher`, `hifz_teacher`, `hostel_manager`, `guardian`, and `student` cannot render `donations` or `cash_book`. If an unauthorized role attempts to access these tabs, redirect to their role dashboard or display a Bengali forbidden banner.

### 6.2 `Sidebar.tsx` Navigation Menus
Update `getNavItems()`:
- **For `accountant` role**:
  ```tsx
  { id: 'dashboard', label: 'হিসাব ও অর্থ ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'finance', label: 'ফি আদায় ও লেজার (POS)', icon: Receipt },
  { id: 'donations', label: 'দান ও ওয়াকফ তহবিল', icon: HeartHandshake },
  { id: 'cash_book', label: 'দৈনিক ক্যাশ বই', icon: Landmark },
  { id: 'students', label: 'শিক্ষার্থী ও বকেয়া ফি', icon: Users },
  { id: 'automation', label: 'বকেয়া রিমাইন্ডার অটোমেশন', icon: Workflow },
  { id: 'ai', label: 'এআই ফাইন্যান্স সহকারী', icon: Sparkles }
  ```
- **For `madrasa_admin`, `principal`, `super_admin` roles**:
  Add `donations` ('দান ও ওয়াকফ') and `cash_book` ('দৈনিক ক্যাশ বই') under the finance grouping in the main menu.

### 6.3 `CommandPalette.tsx` Quick Actions
Add quick links:
```tsx
{ label: 'দান ও অনুদান রসিদ প্রদান (POS)', icon: HeartHandshake, tab: 'donations' },
{ label: 'দৈনিক ক্যাশ বই ও ব্যাংক লেজার', icon: Landmark, tab: 'cash_book' },
```
Add AI prompt chips:
- `✨ "আজকের ক্যাশ বইয়ের সমাপনী ব্যালেন্স কত?"`
- `✨ "লিল্লাহ বোর্ডিং তহবিলে এ মাসে মোট কত দান এসেছে?"`

### 6.4 `AccountantDashboard.tsx` Quick Action Cards
Add 3 prominent cards:
1. **নতুন অনুদান রসিদ** (`onNavigate('donations')`) with `HeartHandshake` icon.
2. **আজকের ক্যাশ বই** (`onNavigate('cash_book')`) with `Landmark` icon.
3. **আবাসিক মেস ও সিট লেজার** (`onNavigate('finance')`) with `Bed` icon.

### 6.5 Translations (`translations.ts`)
Add the following keys to `bn`, `en`, and `ar`:
- `navDonations`: 'দান ও অনুদান' / 'Donations' / 'التبرعات والأوقاف'
- `navCashBook`: 'দৈনিক ক্যাশ বই' / 'Daily Cash Book' / 'دفتر الصندوق اليومي'
- `lillahFund`: 'লিল্লাহ বোর্ডিং ও এতিম তহবিল' / 'Lillah & Orphan Fund' / 'صندوق دار الأيتام'
- `generalFund`: 'সাধারণ তহবিল' / 'General Fund' / 'الصندوق العام'
- `waqfFund`: 'ভবন নির্মাণ ও ওয়াকফ তহবিল' / 'Waqf & Construction Fund' / 'صندوق الوقف والبناء'
- `openingBalance`: 'প্রারম্ভিক ব্যালেন্স' / 'Opening Balance' / 'الرصيد الافتتاحي'
- `closingBalance`: 'সমাপনী ব্যালেন্স' / 'Closing Balance' / 'الرصيد الختامي'

---

## 7. Step-by-Step Implementation Sequence (Phased Roadmap)

### Phase 1: Navigation, Routing & i18n Foundations
1. Update `client/src/i18n/translations.ts` with all new tokens.
2. Update `client/src/components/common/Sidebar.tsx` with role-aware entries for `donations` and `cash_book`.
3. Update `client/src/App.tsx` to mount `<DonationsScreen />` and `<CashBookScreen />`.
4. Update `client/src/components/common/CommandPalette.tsx` with quick links.
5. Verify build compiles with `npm run build:client`.

### Phase 2: Redesign `FinanceScreen.tsx`
1. Refactor tab state (`activeTab`: `'all'` | `'residential'` | `'non_residential'`).
2. Add top tab selector with styled badges and counters.
3. Enhance API fetch to include `?type=` query parameters for segregated tab views.
4. Implement Tab 2 (Residential) with ring-fencing warning, mini KPIs, and residential line items.
5. Implement Tab 3 (Non-Residential) with academic notice, mini KPIs, and academic line items.
6. Enhance `CreateInvoiceModal` with ledger type toggle and fee item presets.
7. Enhance `FeeCollectionModal` with HTTP 409 Conflict duplicate transaction error handling.
8. Add printable fee receipt view on collection success.
9. Verify build compiles with `npm run build:client`.

### Phase 3: Implement `DonationsScreen.tsx`
1. Create `client/src/components/modules/DonationsScreen.tsx`.
2. Construct top ring-fenced fund cards (Lillah & Orphan, General, Construction & Waqf).
3. Implement Donor Registry table with category tabs (All, Permanent, Annual, One-time/Anonymous) and search.
4. Implement `NewDonationModal` with donor selection, fund target radio cards, and receipt generation.
5. Implement `RegisterDonorModal` for new permanent/annual donor onboarding.
6. Implement official printable money receipt layout.
7. Verify build compiles with `npm run build:client`.

### Phase 4: Implement `CashBookScreen.tsx`
1. Create `client/src/components/modules/CashBookScreen.tsx`.
2. Implement header with interactive date picker and quick jump buttons.
3. Implement the 5 golden equation KPI cards (Opening, Collections, Expenses, Bank Deposits, Closing).
4. Implement dual-side ledger breakdown (Debit Inflows vs. Credit Outflows).
5. Implement Madrasa linked bank accounts card.
6. Implement `BankDepositModal` for drawer cash to bank account transfers.
7. Implement printable end-of-day daily cash register sheet.
8. Verify build compiles with `npm run build:client`.

### Phase 5: Verification & End-to-End Alignment
1. Verify role switching: Test logging in as `accountant`, `madrasa_admin`, `teacher`, `guardian` to ensure RBAC isolation is respected in the UI.
2. Run `npm run build:client` to confirm zero TypeScript errors or missing imports.
3. Test responsive layout on mobile, tablet, and desktop viewports.

---

## 8. Edge Cases, UX Hardening & Error Handling

1. **HTTP 409 Conflict Idempotency Guard**:
   - When a cashier enters an already-used transaction ID, the backend responds with HTTP 409 Conflict.
   - The UI must NOT crash or close the modal. It must display a prominent red alert explaining that the payment has already been recorded and prevent duplicate ledger entries.
2. **Ring-Fence Protection Warning**:
   - When recording a donation for Lillah/Orphan fund, display a green/gold notice that these funds cannot be transferred to general madrasa renovations.
3. **Over-collection Prevention**:
   - In the POS Fee modal, disable the submit button and show a validation error if the entered payment amount exceeds the remaining due amount.
4. **Bank Deposit Drawer Validation**:
   - In `BankDepositModal`, prevent entering a bank deposit amount greater than the current cash on hand in the drawer.
5. **Print Layout Isolation**:
   - Vouchers and receipts must have `@media print` CSS classes so that when `window.print()` is triggered, only the voucher prints cleanly without headers, sidebars, or dark backgrounds.
6. **Network Offline/Sync State**:
   - Display a fallback warning if the user is in offline mode while attempting an online payment gateway verification.

---

## 9. Verification & Acceptance Criteria

| Criteria | Verification Method |
|---|---|
| Segregated Tabs in FinanceScreen | Click Tab 2: only residential invoices appear; Click Tab 3: only academic invoices appear |
| Residential Fee Items | Invoices display separate itemization for খোরাকি (mess), সিট (bed), লন্ড্রি/ইউটিলিটি |
| Duplicate Payment Prevention | Enter an existing TrxID in POS modal; UI displays HTTP 409 Conflict error banner |
| Ring-fenced Fund Cards | Donations screen displays 3 cards with distinct balances and Shariah scope warnings |
| Printable Credit Voucher | Submitting a donation opens official money receipt with receipt number and Bengali words |
| Daily Cash Book Calculation | Equation `Opening + Collections - Expenses - Bank Deposits = Closing` strictly holds |
| Date Picker History | Selecting yesterday's date accurately updates the daily cash book view |
| Bank Deposit Logging | Recording a bank deposit reduces drawer cash and credits the selected bank account |
| Navigation Integration | `donations` and `cash_book` appear in Sidebar for accountant/admin and route cleanly |
| Production Build | `npm run build:client` exits with code 0 and zero TypeScript errors |
