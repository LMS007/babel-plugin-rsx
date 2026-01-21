import { useCallback, useEffect, useState } from "react";
import { codeToHtml, type BundledLanguage } from "shiki";
import styles from "./CodeViewer.module.css";

interface CodeViewerProps {
  code: string;
  language?: BundledLanguage;
  filename?: string;
}

export function CodeViewer({ code, language = "tsx", filename }: CodeViewerProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const lineCount = code.split("\n").length;

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: "github-dark",
        });
        if (!cancelled) {
          setHtml(highlighted);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Syntax highlighting failed:", err);
        if (!cancelled) {
          setHtml("");
          setIsLoading(false);
        }
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={styles.codeViewer}>
      {filename && (
        <div className={styles.filename}>
          <span className={styles.filenameIcon}>📄</span>
          {filename}
          <button className={styles.copyButton} onClick={handleCopy} title="Copy to clipboard">
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      )}
      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : html ? (
        <div className={styles.contentWrapper}>
          <div className={styles.lineNumbers}>
            {lineNumbers.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ) : (
        <div className={styles.contentWrapper}>
          <div className={styles.lineNumbers}>
            {lineNumbers.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <pre className={styles.content}>
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
