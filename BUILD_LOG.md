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

**Planned (not yet applied):**  
- `member_id` (uuid, FK → member_database) – which member this lead became, once we match them.  
- Trigger `trg_sync_lead_referral_on_membership_insert` on **member_memberships** INSERT now auto-sets `signed_up`, `membership` (FK), `membership_value`, `price_paid` when a new membership is created and the lead is matched by name.

---

## 2. Enums

- **`sale_objection_reason`**  
  Values (stored in snake_case): `price`, `timing`, `not_ready`, `health_constraints`, `went_elsewhere`, `no_show`, `other`.

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

---

## 4. How it fits together

- **Leads** are stored in `lead_referral` (name, email, who referred them, trial steps, etc.).
- **Referrer** is in `referring_member` (links to `member_database`).
- When a **primary membership** is created in `member_memberships`, the trigger `trg_sync_lead_referral_on_membership_insert` fires and calls `sync_lead_referral_on_new_membership()`. This joins `member_memberships.member_id` to `member_database` to get the full name, then fuzzy-matches against `lead_referral.name` (using ILIKE contains and `word_similarity()` from pg_trgm). If a matching lead is found (not already signed up), it sets `membership` (FK to `member_memberships.id`), `membership_value` and `price_paid` (from `member_newsale_metadata` via `member_memberships.newsale_metadata`), and `signed_up = true`.

See **FLOW.md** for a simple, non-technical flow of how leads and sign-ups work.
