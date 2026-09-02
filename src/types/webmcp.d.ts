/// <reference types="webmcp-types" />

// Chrome shipped WebMCP on navigator.modelContext before the specification moved it to
// document.modelContext (Chromium 150 deprecates the navigator alias). Declare the legacy
// location so the page can fall back to it in older WebMCP-capable browsers.
interface Navigator {
  readonly modelContext?: WebMCP.ModelContext;
}
