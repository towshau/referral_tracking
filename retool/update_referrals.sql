-- Update referrals query (Retool → Supabase)
-- Uses s_1, s_2, s_3 (Session 1, 2, 3) as of lead_referral_rename_t_to_s_sessions migration.
-- Replace the query in your Retool "update_referrals" resource with this.

UPDATE public.lead_referral
SET
  s_1 = COALESCE((payload->>'s_1')::boolean, public.lead_referral.s_1),
  s_2 = COALESCE((payload->>'s_2')::boolean, public.lead_referral.s_2),
  s_3 = COALESCE((payload->>'s_3')::boolean, public.lead_referral.s_3),
  all_completed = COALESCE((payload->>'all_completed')::boolean, public.lead_referral.all_completed),
  reason_nosignup = COALESCE(payload->>'reason_nosignup', public.lead_referral.reason_nosignup),
  sale_objection_reason = COALESCE((payload->>'sale_objection_reason')::public.sale_objection_reason, public.lead_referral.sale_objection_reason)
FROM jsonb_array_elements({{ JSON.stringify(recordsToUpdate || []) }}::jsonb) AS payload
WHERE public.lead_referral.id = (payload->>'id')::uuid;
