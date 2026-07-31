-- IR-002 empty-target compensating removal. Run only after the harness removes
-- all IR-002 target rows and proves no downstream target schema exists.
DROP TABLE public.group_audit_events;
DROP TABLE public.group_configurations;
DROP TABLE public.iso_4217_currency_codes;
DROP FUNCTION public.is_valid_iana_timezone(TEXT);
DROP TABLE public.group_members;
DROP TABLE public.profiles;
DROP TABLE public.groups;
DROP FUNCTION public.ir002_set_updated_at();
