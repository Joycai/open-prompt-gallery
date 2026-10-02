CREATE TABLE login_attempts (id integer PRIMARY KEY CHECK(id=1), failures integer NOT NULL DEFAULT 0, window_start timestamptz NOT NULL DEFAULT now());
INSERT INTO login_attempts(id) VALUES(1);
