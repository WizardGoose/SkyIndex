import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { PANEL } from "../ui/kit";

/**
 * The guide, rendered from public/guide.md.
 *
 * A prose surface, so it drops the tool density: one readable column, generous
 * leading, and headings that carry the hierarchy instead of boxes. The markdown
 * supplies its own h1, so the page does not add a second one.
 */

const LINK = "text-emerald-300 underline decoration-emerald-500/40 underline-offset-4 transition-colors hover:decoration-emerald-400";
const SHELL = "mx-auto w-full max-w-[65ch] px-1 py-10";

export const GuidePage: React.FC = () => {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuideContent = async () => {
      try {
        // BASE_URL rather than a root-absolute path, for the same reason every
        // other public asset here is prefixed: the Pages deploy serves the app
        // from "/Skydex/", where "/guide.md" resolves against the domain root
        // and 404s. BASE_URL carries its own trailing slash.
        const response = await fetch(`${import.meta.env.BASE_URL}guide.md`);
        if (!response.ok) {
          throw new Error("Failed to fetch guide content");
        }
        const content = await response.text();
        setMarkdownContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGuideContent().catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className={SHELL}>
        <div className="flex items-center gap-2.5 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 text-emerald-400 motion-safe:animate-spin" />
          Loading the guide
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={SHELL}>
        <div className={`${PANEL} p-5`}>
          <h1 className="text-sm font-semibold text-slate-100">The guide did not load</h1>
          {/* One line, not two stacked greys. The reason and the remedy belong
              in the same sentence, and the second paragraph was an orphan. */}
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{error}. Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={SHELL}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100" {...props}>
                {children}
              </h1>
              <div className="mt-3 mb-6 h-px bg-gradient-to-r from-emerald-500/60 via-slate-800 to-transparent" />
            </>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mt-10 mb-3 border-b border-slate-800 pb-2 text-lg font-semibold text-slate-100" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mt-7 mb-2 text-[15px] font-semibold text-slate-200" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-4 text-sm leading-[1.8] text-slate-300" {...props}>
              {children}
            </p>
          ),
          a: ({ children, ...props }) => (
            <a className={LINK} {...props}>
              {children}
            </a>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 marker:text-slate-500" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5 marker:text-slate-500" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-sm leading-[1.8] text-slate-300" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-slate-100" {...props}>
              {children}
            </strong>
          ),
          code: ({ children, ...props }) => (
            <code className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-200" {...props}>
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre
              className="mb-5 overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-[12px] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-200"
              {...props}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="mb-5 border-l-2 border-emerald-500/50 pl-4 text-sm leading-[1.8] text-slate-400" {...props}>
              {children}
            </blockquote>
          ),
          table: ({ children, ...props }) => (
            <div className="mb-5 overflow-x-auto">
              <table className="w-full border-collapse text-[12px]" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border-b border-slate-700 px-2 py-1.5 text-left font-semibold text-slate-200" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border-b border-slate-800/70 px-2 py-1.5 text-slate-300" {...props}>
              {children}
            </td>
          ),
          hr: ({ ...props }) => <hr className="my-9 border-slate-800" {...props} />,
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};
