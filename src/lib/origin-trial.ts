/**
 * Chrome WebMCP origin-trial token for https://protocol-mirror.vercel.app.
 *
 * An origin-trial token is bound to one origin and is meant to be served in the page, so it is
 * public by design and safe to commit. When set, Chrome 149+ enables WebMCP on that origin without
 * chrome://flags/#enable-webmcp-testing. Paste the token from developer.chrome.com/origintrials
 * below, or provide it as NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN at build time. Other origins
 * (a local build, a fork) still need the flag.
 */
const PASTED_TOKEN = "";

export const WEBMCP_ORIGIN_TRIAL_TOKEN = (process.env.NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN ?? PASTED_TOKEN).trim();
export const WEBMCP_ORIGIN_TRIAL_ORIGIN = "https://protocol-mirror.vercel.app";
