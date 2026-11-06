-- Owned by the pet module.

CREATE TABLE pets (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    uuid NOT NULL REFERENCES users (id),
    name        text NOT NULL,
    species     text NOT NULL,
    breed       text,
    gender      text NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
    birth_date  date,
    color       text,
    -- Random and public: printed in the QR code. Never grants clinic access.
    public_code text NOT NULL UNIQUE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pets_owner_id_idx ON pets (owner_id);
