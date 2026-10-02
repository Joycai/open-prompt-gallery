CREATE TABLE models (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX models_name_unique ON models(lower(name));
CREATE TABLE prompts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), model_id uuid NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 160), body text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('full','piece')) DEFAULT 'full',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prompts_model ON prompts(model_id);
CREATE INDEX prompts_kind ON prompts(kind);
CREATE INDEX prompts_updated ON prompts(updated_at DESC);
CREATE TABLE tags (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, normalized text NOT NULL UNIQUE);
CREATE TABLE prompt_tags (prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE, tag_id uuid REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(prompt_id,tag_id));
CREATE INDEX prompt_tags_tag ON prompt_tags(tag_id);
CREATE TABLE groups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 160), description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE group_prompts (group_id uuid REFERENCES groups(id) ON DELETE CASCADE, prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE, PRIMARY KEY(group_id,prompt_id));
CREATE INDEX group_prompts_prompt ON group_prompts(prompt_id);
CREATE TABLE images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), storage_key text NOT NULL UNIQUE,
 prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE, group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
 alt text NOT NULL DEFAULT '', mime text NOT NULL, width integer NOT NULL, height integer NOT NULL, bytes integer NOT NULL,
 position integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((prompt_id IS NOT NULL)::int + (group_id IS NOT NULL)::int = 1)
);
CREATE INDEX images_prompt ON images(prompt_id,position,created_at);
CREATE INDEX images_group ON images(group_id,position,created_at);
-- Deleted image bytes are collected after metadata commits, including cascade deletes.
CREATE TABLE file_cleanup (storage_key text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION queue_image_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN INSERT INTO file_cleanup(storage_key) VALUES(OLD.storage_key) ON CONFLICT DO NOTHING; RETURN OLD; END;
$$;
CREATE TRIGGER image_cleanup AFTER DELETE ON images FOR EACH ROW EXECUTE FUNCTION queue_image_cleanup();
