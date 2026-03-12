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
- Trigger on **member_memberships** INSERT to auto-set `signed_up`, `member_id`, `membership` (name), `membership_type_id`, `membership_value`, `price_paid` when a primary membership is created and we match the lead by name/email.

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

---

## 4. How it fits together

- **Leads** are stored in `lead_referral` (name, email, who referred them, trial steps, etc.).
- **Referrer** is in `referring_member` (links to `member_database`).
- When a **primary membership** is created in `member_memberships`, a trigger (when implemented) will match the new member to a lead by name/email and update that lead’s `signed_up`, `member_id`, `membership` (name), `membership_type_id`, `membership_value`, and `price_paid`.

See **FLOW.md** for a simple, non-technical flow of how leads and sign-ups work.
