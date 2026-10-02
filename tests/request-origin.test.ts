import test from "node:test";
import assert from "node:assert/strict";
import { hasValidRequestOrigin } from "../src/lib/request-origin";

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/upload", {
    method: "POST",
    headers,
  });
}

test("uploads accept the current browser origin despite a stale APP_ORIGIN", () => {
  assert.equal(
    hasValidRequestOrigin(
      request({ origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" }),
      "http://localhost:3000",
    ),
    true,
  );
});

test("HTTP LAN uploads use the public Host instead of the internal URL", () => {
  assert.equal(
    hasValidRequestOrigin(
      request({
        origin: "http://192.168.1.100:8080",
        host: "192.168.1.100:8080",
      }),
      "http://localhost:3000",
    ),
    true,
  );
});

test("HTTPS proxy uploads accept browser same-origin metadata", () => {
  assert.equal(
    hasValidRequestOrigin(
      request({
        origin: "https://prompts.example.com",
        host: "localhost:3000",
        "sec-fetch-site": "same-origin",
      }),
      "http://localhost:3000",
    ),
    true,
  );
});

test("configured public origin works without Fetch Metadata behind a proxy", () => {
  assert.equal(
    hasValidRequestOrigin(
      request({ origin: "https://prompts.example.com" }),
      "https://prompts.example.com/",
    ),
    true,
  );
  assert.equal(
    hasValidRequestOrigin(request({ origin: "http://localhost:3000" }), ""),
    true,
  );
});

test("cross-site and same-site uploads are rejected even for a configured origin", () => {
  for (const site of ["cross-site", "same-site", "none", "unexpected"])
    assert.equal(
      hasValidRequestOrigin(
        request({ origin: "http://localhost:3000", "sec-fetch-site": site }),
        "http://localhost:3000",
      ),
      false,
    );
});

test("origin checks include scheme, hostname, and port without trusting forwarded hosts", () => {
  for (const origin of [
    "https://localhost:3000",
    "http://localhost:3001",
    "http://evil.example",
    "http://localhost.evil.example:3000",
  ])
    assert.equal(
      hasValidRequestOrigin(
        request({
          origin,
          host: "localhost:3000",
          "x-forwarded-host": new URL(origin).host,
        }),
        "http://localhost:3000",
      ),
      false,
    );
});

test("missing, opaque, malformed, and non-origin values are rejected", () => {
  assert.equal(
    hasValidRequestOrigin(request(), "http://localhost:3000"),
    false,
  );
  for (const origin of [
    "null",
    "invalid",
    "file:///",
    "http://user:password@localhost:3000",
    "http://localhost:3000/path",
    "http://localhost:3000?query",
    "http://localhost:3000#fragment",
  ])
    assert.equal(
      hasValidRequestOrigin(
        request({ origin, "sec-fetch-site": "same-origin" }),
        "http://localhost:3000",
      ),
      false,
    );
});
