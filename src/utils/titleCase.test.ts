import { describe, expect, it } from "vitest";
import { titleCase } from "./titleCase";

describe("titleCase", () => {
  it("capitalises each space-separated word", () => {
    expect(titleCase("austin texas")).toBe("Austin Texas");
    expect(titleCase("new york city")).toBe("New York City");
  });

  it("returns empty string for empty input", () => {
    expect(titleCase("")).toBe("");
  });

  it("preserves already-capitalised words", () => {
    expect(titleCase("Austin TX")).toBe("Austin TX");
  });

  it("does not modify the rest of the word past the first letter", () => {
    expect(titleCase("aBC dEF")).toBe("ABC DEF");
  });
});
