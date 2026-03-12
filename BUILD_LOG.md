# Referral tracking – build log

Running log of what’s been created for the [referral_tracking](https://github.com/towshau/referral_tracking) project (Supabase + Lockeroom).

---

## 1. Database: `lead_referral` table

**Created:** Table to track referred leads (consult/trial) and whether they sign up.

| Column | Type | Purpose |
|--------|------|--------|
| `id` | uuid | Unique row id (auto) |
| `s_1`, `s_2`, `s_3` | boolean | Session 1, 2, 3 (trial/consult steps) |
| `all_completed` | boolean | All steps done |
| `signed_up` | boolean | Lead became a member (can be automated) |
| `membership` | text | **Name** of membership they chose (e.g. "6 Month PERFORM - x3") |
| `membership_type_id` | uuid | Link to membership type (optional, for automation) |
| `membership_value` | numeric | List/agreed value of membership |
| `price_paid` | numeric | What they actually paid |
| `reason_nosignup` | text | If they didn’t sign up, why (free text) |
| `referring_member` | uuid | **Who referred them** (FK → member_database) |
| `date_created` | timestamptz | When the lead was logged |
| `referral_type` | text | Type of referral |
| `attribution_notes` | text | Notes for attribution |
| `name` | text | Lead’s name |
| `phone` | text | Lead’s phone |
| `email` | text | Lead’s email |
| `sale_objection_reason` | enum | If they didn’t buy: Price, Timing, Not Ready, Health Constraints, Went Elsewhere, No Show, Other |

**Applied:**  
- Trigger `trg_sync_lead_referral_on_membership_insert` on **member_memberships** INSERT auto-sets `signed_up`, `membership` (FK), `membership_value`, `price_paid` when a new membership is created and the lead is matched by name.
- Trigger `trg_issue_referral_credit_on_signup` on **lead_referral** UPDATE auto-issues a $1k credit in `member_referral_credits` when `signed_up` becomes true.

---

## 2. Enums

- **`sale_objection_reason`**  
  Values: `price`, `timing`, `not_ready`, `health_constraints`, `went_elsewhere`, `no_show`, `other`.

- **`referral_touchpoint_type`**  
  Values: `seasonal_promotion`, `renewal`, `winning_client_result`, `survey_response`, `3_month_revenue_call`, `30_day_call`, `new_sale_email_welcome_pack`.

---

## 3. Migrations applied (Supabase)

| “plain” and “O/P” options show PERFORM in the name:



| Migration | What it did |
|-----------|-------------|
| `create_lead_referral_table` | Created `lead_referral` with id, t_1–t_3, all_completed, signed_up, membership, membership_value, price_paid, reason_nosignup; RLS on then disabled. |
| `lead_referral_rename_t_to_s_sessions` | Renamed `t_1` → `s_1`, `t_2` → `s_2`, `t_3` → `s_3` (Session 1, 2, 3). |
| `lead_referral_add_fk_columns_rename_disable_rls` | Added referring_member, date_created, referral_type, attribution_notes; disabled RLS. |
| `lead_referral_add_name_phone_email` | Added name, phone, email (text). |
| `lead_referral_rename_raisin_to_reason_nosignup` | Renamed raisin to reason_nosignup. |
| `add_sale_objection_reason_enum_and_column` | Created sale_objection_reason enum and column. |
| `lead_referral_add_fk_membership_to_member_memberships` | Added FK constraint `lead_referral.membership` → `member_memberships.id`. |
| `create_sync_lead_referral_on_new_membership` | Created function `sync_lead_referral_on_new_membership()`: on new membership insert, fuzzy-match member name to lead_referral.name; update membership (FK), membership_value, price_paid, signed_up. |
| `create_trigger_sync_lead_referral_on_membership_insert` | Created trigger `trg_sync_lead_referral_on_membership_insert` AFTER INSERT on member_memberships. |
| `create_referral_touchpoint_type_enum` | Created enum `referral_touchpoint_type` with 7 values for touchpoint tracking. |
| `create_member_referral_log_table` | Created `member_referral_log` table: id, member_id (FK), touchpoint_type (enum), touchpoint_date, staff_member_id (FK), notes, created_at. |
| `create_member_referral_credits_table` | Created `member_referral_credits` table: id, member_id (FK), lead_referral_id (FK), amount (default 1000), issued_at, applied_to_renewal, date_applied, notes, created_at. |
| `create_issue_referral_credit_on_signup` | Created function `issue_referral_credit_on_signup()` and trigger `trg_issue_referral_credit_on_signup` AFTER UPDATE on lead_referral. |
| `create_member_referral_view` | Created view `member_referral_view`: per-member referral count (signed-up only), credit balances, last touchpoint. |
| `update_member_referral_view_count_signed_up_only` | Updated view: referral_count now only counts leads where signed_up = true. |
| `add_membership_id_to_member_referral_credits` | Added `membership_id` (uuid FK to member_memberships) to `member_referral_credits` — links credit to the referred lead's membership. |
| `update_issue_referral_credit_with_membership_id` | Updated `issue_referral_credit_on_signup()` to also set `membership_id = NEW.membership` when issuing the credit. |

---

## 4. How it fits together

- **Leads** are stored in `lead_referral` (name, email, who referred them, trial steps, etc.).
- **Referrer** is in `referring_member` (links to `member_database`).
- When a **primary membership** is created in `member_memberships`, the trigger `trg_sync_lead_referral_on_membership_insert` fires and calls `sync_lead_referral_on_new_membership()`. This joins `member_memberships.member_id` to `member_database` to get the full name, then fuzzy-matches against `lead_referral.name` (using ILIKE contains and `word_similarity()` from pg_trgm). If a matching lead is found (not already signed up), it sets `membership` (FK to `member_memberships.id`), `membership_value` and `price_paid` (from `member_newsale_metadata` via `member_memberships.newsale_metadata`), and `signed_up = true`.

- When a lead's `signed_up` is set to true (by the sync trigger above), `trg_issue_referral_credit_on_signup` fires `issue_referral_credit_on_signup()` which auto-creates a $1k credit row in `member_referral_credits` for the referring member, including `membership_id` linking to the referred lead's membership (duplicate-guarded).
- **`member_referral_log`** records staff-logged touchpoints per member (type from `referral_touchpoint_type` enum, date, staff, notes).
- **`member_referral_view`** aggregates per member: referral count, credit balances (earned/redeemed/outstanding), and latest touchpoint.

See **FLOW.md** for a simple, non-technical flow of how leads and sign-ups work.
