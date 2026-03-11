# Referral Dashboard – Dataflow & Progress

This document reflects the current state of Supabase objects for the Lockeroom Referral Program (from the [Referral Dashboard Build Plan](.cursor/plans/referral_dashboard_build_plan_fa12ee9d.plan.md)).  
**Green** = created and present in Supabase. **Red** = not yet created.

---

## Summary: Created vs not created

| Type | Created (green) | Not created (red) |
|------|------------------|-------------------|
| **Tables** | `lead_referral` | `member_referral_log`, `referral_credit` (or referral type on `member_holds`) |
| **Views** | — | `member_referral_view` |
| **Functions** | — | (none specified in plan; trigger logic for “issue credit on sign-up” would call or live in DB) |
| **Triggers** | — | Trigger on `lead_referral` or downstream when `signed_up = true` → create referral credit |
| **Cron** | — | No referral-specific cron found; backfill for T1/T2/T3 from `member_memberships` / newsale may be external or Retool |
| **RLS** | — | RLS not enabled on `lead_referral`; no policies for referral tables yet |
| **Automation** | Retool Referral Tracking Form (writes to `lead_referral`) | Auto-issue $1k credit on sign-up; auto-flag for revenue/survey score 8–10 |

---

## Dataflow diagram (left → right timeline)

Flow is **left to right**: from “existing member refers a lead” through to “lead in `lead_referral`”, trial/conversion, and (future) credit.  
Automations/triggers sit **above** (data entry / touchpoints) and **below** (downstream actions).

```mermaid
flowchart LR
  subgraph legend [" "]
    direction LR
    L1[Created]
    L2[Not created]
  end

  subgraph entry ["Entry & capture"]
    A[("Existing member refers lead")]
    B[("Referral Tracking Form (Retool)")]
    C[(("lead_referral"))]
  end

  subgraph trial ["Trial & conversion"]
    D[T1 / T2 / T3 completed]
    E[Completed All 3]
    F[Signed up?]
    G[Membership / value / price]
  end

  subgraph future ["Reward (not built)"]
    H[(("referral_credit"))]
    I[("member_holds or dedicated table")]
  end

  subgraph sources ["Existing sources"]
    M[(member_database)]
    MM[(member_memberships)]
    NM[(member_newsale_metadata)]
  end

  A --> B
  B --> C
  C --> D
  D --> E
  E --> F
  F --> G
  F -.->|"when signed_up = true (planned)"| H
  H -.-> I

  MM -.->|backfill / CRON planned| C
  NM -.->|backfill planned| C

  style C fill:#9f9,stroke:#2d5a27
  style A fill:#9f9,stroke:#2d5a27
  style B fill:#9f9,stroke:#2d5a27
  style M fill:#9f9,stroke:#2d5a27
  style MM fill:#9f9,stroke:#2d5a27
  style NM fill:#9f9,stroke:#2d5a27
  style H fill:#f99,stroke:#8b0000
  style I fill:#f99,stroke:#8b0000
```

---

## Automations and triggers (above/below flow)

```mermaid
flowchart TB
  subgraph above ["Data entry / touchpoints (above the main flow)"]
    F1[("Referral Tracking Form (Retool)")]
    F2[("member_referral_log – touchpoint history")]
    F3[("Staff logs touchpoint type + date + staff")]
  end

  subgraph main ["Main table flow"]
    T1[(("lead_referral"))]
  end

  subgraph below ["Downstream automations (below the main flow)"]
    A1["Trigger: when signed_up = true"]
    A2["Create / update referral credit ($1k)"]
    A3["(Optional) CRON: backfill T1/T2/T3 from member_memberships / newsale"]
    A4["Auto-flag: revenue or survey score 8–10 (Phase 2)"]
  end

  F1 --> T1
  F2 -.->|"feeds member_referral_view"| F3
  T1 --> A1
  A1 --> A2
  A3 -.-> T1
  A4 -.-> T1

  style T1 fill:#9f9,stroke:#2d5a27
  style F1 fill:#9f9,stroke:#2d5a27
  style F2 fill:#f99,stroke:#8b0000
  style F3 fill:#f99,stroke:#8b0000
  style A1 fill:#f99,stroke:#8b0000
  style A2 fill:#f99,stroke:#8b0000
  style A3 fill:#f99,stroke:#8b0000
  style A4 fill:#f99,stroke:#8b0000
```

---

## Tables and views reference

| Object | Status | Notes |
|--------|--------|--------|
| **lead_referral** | ✅ Created | Referral name, phone, email, referring_member, date_created, referral_type, attribution_notes; T1/T2/T3, all_completed, signed_up, membership, membership_value, price_paid, reason_nosignup, sale_objection_reason. |
| **member_referral_view** | ❌ Not created | Planned view: one row per active member, has_referred, referral count, membership value, renewal date, credit balances, last touchpoint date/type/staff. |
| **member_referral_log** | ❌ Not created | Planned table: touchpoint history (member_id, touchpoint_type, touchpoint_date, staff_member_id, notes). |
| **referral_credit** (or member_holds extension) | ❌ Not created | $1k credit per successful referral; issued/redeemed/outstanding; trigger when signed_up = true. |
| **member_database** | ✅ Exists | Source for active members and member list. |
| **member_memberships** | ✅ Exists | Source for renewal/sign-up and backfill. |
| **member_newsale_metadata** / **member_renewal_meta** | ✅ Exist | Source for new sale/renewal and backfill. |
| **member_holds** | ✅ Exists | No referral-specific column yet; plan Option A is to add referral type/tag here, or use new **referral_credit** table. |

---

## Functions and triggers

- **Referral-specific functions:** None found in Supabase (no `*referral*` or `*lead*` functions besides unrelated `get_nutrition_lead_hours_for_week`).
- **Triggers on lead_referral:** None. No triggers on any referral table yet.
- **Planned:** Trigger (or CRON) when a lead is marked Signed Up → create/update row in `referral_credit` (or equivalent) for `referring_member`, optionally linked to `lead_referral.id`.

---

## Cron jobs

- **Referral-related cron:** None. Existing cron jobs cover coach expectations, schedule periods, snapshots, attendance views, etc.
- **Planned:** CRON/backfill from `member_memberships` and newsale meta into `lead_referral` for T1/T2/T3 and conversion (if not done entirely in Retool).

---

*Last aligned with build plan: Sections 1–11; Sections 2 (Lead Table & Form) and 3 (Trial & Conversion Tracking) treated as completed in scope.*
