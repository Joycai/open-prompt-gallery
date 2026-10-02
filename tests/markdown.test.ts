import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PromptMarkdown } from "../src/components/prompt-markdown";

function render(body: string) {
  return renderToStaticMarkup(createElement(PromptMarkdown, { body }));
}

test("renders Markdown blocks and GFM without altering source", () => {
  const source =
    "# Vision\n\nA **warm** portrait.\n\n- Soft light\n\n```text\nraw prompt\n```\n\n| Mood | Light |\n| --- | --- |\n| Calm | Soft |";
  const html = render(source);
  for (const content of [
    "<h1>Vision</h1>",
    "<strong>warm</strong>",
    "<li>Soft light</li>",
    '<code class="language-text">raw prompt',
    "<table>",
  ])
    assert.ok(html.includes(content));
});

test("does not execute embedded HTML or unsafe link protocols", () => {
  const html = render(
    "<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n[safe](https://example.com)",
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('href="https://example.com"'));
});
