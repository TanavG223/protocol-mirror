import { describe, expect, it } from "vitest";
import { diffIsReadable, wordDiff } from "./word-diff";

describe("wordDiff", () => {
  it("marks the words that differ between the registered and reported wording", () => {
    const parts = wordDiff(
      "Change from baseline in mean 24-hour ambulatory systolic blood pressure at week 24.",
      "The primary endpoint was adjusted clinic systolic pressure at week 12.",
    );
    const left = parts.filter((part) => part.kind === "left").map((part) => part.text).join(" | ");
    const right = parts.filter((part) => part.kind === "right").map((part) => part.text).join(" | ");
    expect(left).toContain("24-hour ambulatory");
    expect(left).toContain("24.");
    expect(right).toContain("clinic");
    expect(right).toContain("12.");
    expect(parts.filter((part) => part.kind === "same").map((part) => part.text).join(" ")).toContain("systolic");
    expect(parts.map((part) => part.text).join(" ").split(" ").length).toBeGreaterThan(10);
  });

  it("treats identical quotations as one unchanged run and preserves original casing", () => {
    expect(wordDiff("Time to Recovery", "time to recovery")).toEqual([{ text: "Time to Recovery", kind: "same" }]);
  });

  it("only offers a diff for short quotations", () => {
    expect(diffIsReadable("a b c", "a b d")).toBe(true);
    expect(diffIsReadable("word ".repeat(120), "short")).toBe(false);
  });
});
