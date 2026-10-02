CREATE TABLE admin_account (
  id integer PRIMARY KEY CHECK (id = 1),
  username text NOT NULL DEFAULT 'admin' CHECK (username = 'admin'),
  password_hash text NOT NULL,
  session_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
