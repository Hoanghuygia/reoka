-- Owned by the identity module.

CREATE TABLE users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Zalo only provides a name once the user grants the userInfo permission.
    name       text,
    phone      text,
    address    text,
    is_admin   boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider      text NOT NULL CHECK (provider IN ('zalo', 'password')),
    provider_uid  text NOT NULL,
    password_hash text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_uid),
    CHECK ((provider = 'password') = (password_hash IS NOT NULL))
);

CREATE INDEX auth_identities_user_id_idx ON auth_identities (user_id);
