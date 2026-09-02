"use client";

const SESSION_KEY = "protocol-mirror.session.v2";

/** Last-resort screen: a broken saved session or a runtime error must never leave a judge on a blank page. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const clearAndReload = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nothing to clear */ }
    window.location.assign("/");
  };
  return (
    <main className="error-shell">
      <p className="eyebrow">Protocol Mirror</p>
      <h1>The workspace hit an error.</h1>
      <p>{error.message || "Something went wrong while rendering the review workspace."}</p>
      <div className="error-actions">
        <button type="button" className="primary-action" onClick={reset}>Try again</button>
        <button type="button" className="text-button" onClick={clearAndReload}>Clear the saved session and reload</button>
      </div>
    </main>
  );
}
