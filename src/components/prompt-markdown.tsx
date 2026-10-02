import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function PromptMarkdown({ body }: { body: string }) {
  return (
    <div className="prompt-body prompt-markdown">
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  );
}
