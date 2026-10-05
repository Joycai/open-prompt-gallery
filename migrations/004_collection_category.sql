ALTER TABLE groups ADD COLUMN category text NOT NULL DEFAULT ''
  CHECK (char_length(category) <= 80);
