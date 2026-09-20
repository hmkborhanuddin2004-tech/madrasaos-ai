# MadrasaOS AI - Platform Architecture Specification

## Executive Summary
**MadrasaOS AI** is a production-grade, multi-tenant, digital operating system engineered specifically for Islamic educational institutions in Bangladesh (Qawmi, Alia, Hifz, Nazera, Kitab, Boarding/Residential, and Hybrid institutions). 

The platform is architected across three core pillars:
1. **Institutional Management Core**: Multi-model academic hierarchy, student 360, attendance, Hifz Quran tracking, Kitab progress, examinations, fee collection with Bangladeshi digital payments (bKash, Nagad, Rocket), boarding/hostel management, admissions, library, and immutable financial accounting.
2. **Permission-Aware AI Agent Layer**: Natural language administrative assistant with deterministic tool grounding, zero database hallucinations, context-aware advice, daily automated briefings, and conversational workflow drafting.
3. **Enterprise Automation Engine**: Event-driven, cron-scheduled, webhook, and AI-powered workflow automation system featuring a visual node builder, dry-run simulation, human-in-the-loop approval gates, retry policies, and 20+ pre-built Madrasa templates.

---

## 1. System Topology & Layers

```
                                  CLIENT APPS
   ┌───────────────────────────────────┴───────────────────────────────────┐
   │                                                                       │
   ▼                                                                       ▼
[Android / Mobile Web PWA]                                       [Responsive Desktop Web Admin]
(Touch-first, Bottom Nav, Offline Queue,                         (Multi-pane layout, Sidebar, Data Tables,
 Bangla/English/Arabic, Fast Sabaq Entry)                         Workflow Canvas Builder, Analytics)
   │                                                                       │
   └───────────────────────────────────┬───────────────────────────────────┘
                                       │ HTTPS / WSS / REST APIs
                                       ▼
                       [API GATEWAY & SECURITY PERIMETER]
       - Rate Limiter & IP Throttling
       - TLS 1.3 Termination
       - JWT & Session Validation
       - Tenant & Branch Context Extraction (`X-Tenant-ID`, `X-Branch-ID`)
       - Multi-Language Content Negotiation (bn-BD, en-US, ar-SA)
                                       │
   ┌───────────────────────────────────┼───────────────────────────────────┐
   │                                   │                                   │
   ▼                                   ▼                                   ▼
[DOMAIN SERVICES CORE]      [AI AGENT ENGINE]               [AUTOMATION ENGINE]
├─ Identity & RBAC/ABAC     ├─ Intent Classifier & Parser   ├─ Event Bus & Dispatcher
├─ Institution & Branch     ├─ RBAC Tool Permission Enforcer├─ Cron & Interval Scheduler
├─ Multi-Program Academics  ├─ Factual Database Tool Binder ├─ Graph Execution Engine
├─ Student 360 & Guardians  ├─ Context Synthesizer (Zero    ├─ Node Processors (Triggers,
├─ Smart Attendance Engine  │   Hallucination Guarantee)    │  Filters, Logic, Actions)
├─ Dedicated Hifz Tracker   ├─ Daily Briefing Generator     ├─ Human Approval Queue
├─ Kitab Syllabus Tracker   ├─ Natural Language Workflow    ├─ Retry & Dead-Letter Queue
├─ Exam & Result Engine     │   Compiler                    └─ Webhook Ingress / Egress
├─ Invoicing & Accounts     └─ Bangla Semantic Adapter
├─ Payment Provider Hub                                            │
│  (bKash, Nagad, Rocket)                                          ▼
├─ Hostel & Boarding Hub                                   [EXTERNAL CONNECTORS]
├─ Admission Funnel                                        ├─ SMS Gateways (Bangla Unicode)
├─ Library & Circulation                                   ├─ Push Notifications (FCM / WebPush)
├─ Document & PDF Engine                                   ├─ Payment Gateways (bKash, Nagad)
└─ Audit Trail Logger                                      ├─ Email (SMTP / Transactional)
   │                                                       └─ Azure / Cloud Functions
   └───────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
                     [DATA PERSISTENCE & STORAGE TIER]
       - Relational Database (Relational Schema, Foreign Keys, Strict ACID)
       - Tenant Data Isolation (Row-Level Tenant & Branch Scoping)
       - Immutable Financial & Result Audit Ledger
       - Document & Certificate Artifact Vault
       - Client-side Offline IndexedDB & Sync Engine
```

---

## 2. Multi-Model Institution Architecture

Traditional school ERPs fail in Madrasas because they enforce a rigid `Grade 1 -> Grade 12` structure. MadrasaOS AI implements a **Poly-Hierarchical Academic Model**:

```
[PLATFORM]
  └── [ORGANIZATION] (e.g. Al-Jamiatul Islamia Trust)
        └── [INSTITUTION] (e.g. Darul Uloom Central Madrasa)
              └── [BRANCH / CAMPUS] (e.g. Main Campus, Mirpur Branch)
                    ├── [PROGRAM 1: QAWMI]
                    │     ├── Department: Marhalah (Ibtidaiyyah, Mutawassitah, Sanawiyyah, Takmil)
                    │     ├── Jamaat: Nahbemir, Hidayatun Nahw, Kafiya, Mishkat, Dawra-e-Hadith
                    │     └── Kitab: Arabic Grammar, Fiqh, Usul, Hadith (Bukhari, Muslim)
                    │
                    ├── [PROGRAM 2: HIFZ-UL-QURAN]
                    │     ├── Levels: Nazera -> Ampara -> Hifz (1-30 Para)
                    │     └── Daily Vectors: Sabaq (new), Sabqi (recent), Manzil (revision)
                    │
                    ├── [PROGRAM 3: ALIA MADRASA]
                    │     ├── Department: Ebtedayee, Dakhil, Alim, Fazil, Kamil
                    │     └── Curriculum: Bangladesh Madrasah Education Board (BMEB)
                    │
                    └── [PROGRAM 4: RESIDENTIAL / BOARDING]
                          ├── Hostels: Omar Farooq Hall, Usman Ghani Hall
                          └── Allocations: Building -> Floor -> Room -> Bed -> Meal Plan
```

### Multi-Program Student Identity
A single student record in MadrasaOS AI can be enrolled concurrently in multiple programs without duplication:
- **Main Academic**: Qawmi Jamaat (Kafiya)
- **Specialized Track**: Hifz Program (Para 18 revision)
- **Residential Status**: Boarding Resident (Room 204, Bed B)
- **Guardian Relation**: Single digital guardian linking multiple siblings across branches.

---

## 3. Technology Stack Rationale

| Layer | Selected Stack | Rationale |
|---|---|---|
| **Backend Runtime** | Node.js (TypeScript) + Express | Industry-standard async I/O, rich ecosystem for workflow engines, zero-latency JSON manipulation, rapid microservices extensibility. |
| **Data Persistence** | Relational Database with Foreign Key Enforcements & Transactions | Guarantees strict ACID properties required for financial transactions, attendance records, exam marks, and multi-tenant isolation. |
| **API Contract** | RESTful JSON + Server-Sent Events (SSE) | Lightweight, accessible for mobile clients under 2G/3G conditions, real-time sync for workflow execution status and AI streaming. |
| **Frontend Framework** | React 18 / Vite + TypeScript + Tailwind CSS | Responsive mobile-first PWA and desktop web admin, accessible component library, instantaneous HMR, robust state management. |
| **Localization** | i18n Engine (Bangla BN, English EN, Arabic AR) | Native Bangla font rendering (SolaimanLipi/Hind Siliguri), Arabic RTL support, institutional number formatting (Bangla Numerals ०-৯ vs Western 0-9). |
| **Document Engine** | HTML-to-PDF & High-Resolution Vector Engine | Official certificates, receipts, marksheet generation with QR verification payload. |

---

## 4. Multi-Tenancy & Data Isolation

Tenant isolation is enforced across three defensive layers:
1. **Network Layer**: Request headers `X-Tenant-ID` and `X-Branch-ID` are cryptographically verified against the authenticated user's JWT claim.
2. **Service Layer**: Every repository query strictly injects `tenantId` (and `branchId` when applicable). Cross-tenant queries are rejected at runtime with an `AuthorizationError`.
3. **Data Layer**: Composite foreign keys and unique constraints include `tenant_id` to prevent cross-tenant collisions.
