-- IR-005 isolated candidate: Invitation persistence only.
-- No browser access or callable lifecycle operation is introduced by this file.
BEGIN;

CREATE ROLE ir005_invitation_executor
  NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS;

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  created_by_group_member_id uuid NOT NULL,
  recipient_email text NOT NULL CHECK (
    recipient_email = lower(btrim(recipient_email))
    AND length(recipient_email) BETWEEN 3 AND 320
    AND position('@' IN recipient_email) > 1
  ),
  proof_verifier bytea NOT NULL UNIQUE CHECK (octet_length(proof_verifier) = 32),
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  accepted_by_group_member_id uuid,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, id),
  FOREIGN KEY (group_id, created_by_group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id, accepted_by_group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  CONSTRAINT invitations_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT invitations_terminal_state CHECK (
    (status = 'pending' AND accepted_by_group_member_id IS NULL
      AND accepted_at IS NULL AND revoked_at IS NULL AND expired_at IS NULL)
    OR (status = 'accepted' AND accepted_by_group_member_id IS NOT NULL
      AND accepted_at IS NOT NULL AND revoked_at IS NULL AND expired_at IS NULL)
    OR (status = 'revoked' AND accepted_by_group_member_id IS NULL
      AND accepted_at IS NULL AND revoked_at IS NOT NULL AND expired_at IS NULL)
    OR (status = 'expired' AND accepted_by_group_member_id IS NULL
      AND accepted_at IS NULL AND revoked_at IS NULL AND expired_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX invitations_one_pending_recipient_per_group_idx
  ON public.invitations (group_id, recipient_email)
  WHERE status = 'pending';
CREATE INDEX invitations_group_status_expiry_idx
  ON public.invitations (group_id, status, expires_at);
CREATE INDEX invitations_recipient_status_idx
  ON public.invitations (recipient_email, status);

CREATE TABLE public.ir005_invitation_requests (
  operation text NOT NULL CHECK (operation IN ('TOP-002', 'TOP-003')),
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  request_fingerprint jsonb NOT NULL CHECK (jsonb_typeof(request_fingerprint) = 'object'),
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  invitation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (operation, actor_profile_id, group_id, request_id),
  FOREIGN KEY (group_id, invitation_id)
    REFERENCES public.invitations(group_id, id) ON DELETE RESTRICT,
  CONSTRAINT ir005_invitation_requests_completion_check CHECK (
    (status = 'pending' AND invitation_id IS NULL AND completed_at IS NULL)
    OR (status = 'completed' AND invitation_id IS NOT NULL AND completed_at IS NOT NULL)
  )
);
CREATE INDEX ir005_invitation_requests_invitation_idx
  ON public.ir005_invitation_requests (invitation_id);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ir005_invitation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir005_invitation_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.invitations, public.ir005_invitation_requests
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
