import { describe, expect, it } from "vitest";

import { parseViewBounds, validateAppyUrl } from "./externalBrowser.ts";

// ---------------------------------------------------------------------------
// validateAppyUrl
// ---------------------------------------------------------------------------

describe("validateAppyUrl", () => {
  it("returns the normalized href for a valid https URL", () => {
    const result = validateAppyUrl("https://example.com");
    expect(typeof result).toBe("string");
    expect(result).toContain("https://example.com");
  });

  it("returns the normalized href for a valid http URL", () => {
    const result = validateAppyUrl("http://example.com");
    expect(typeof result).toBe("string");
    expect(result).toContain("http://example.com");
  });

  it("returns null for a file:// URL", () => {
    expect(validateAppyUrl("file:///etc/passwd")).toBeNull();
  });

  it("returns null for a javascript: URL", () => {
    expect(validateAppyUrl("javascript:alert(1)")).toBeNull();
  });

  it("returns null for a data: URL", () => {
    expect(validateAppyUrl("data:text/html,<h1>x</h1>")).toBeNull();
  });

  it("returns null for an ftp:// URL", () => {
    expect(validateAppyUrl("ftp://example.com")).toBeNull();
  });

  it("returns null when given a number instead of a string", () => {
    expect(validateAppyUrl(42)).toBeNull();
  });

  it("returns null when given null", () => {
    expect(validateAppyUrl(null)).toBeNull();
  });

  it("returns null when given undefined", () => {
    expect(validateAppyUrl(undefined)).toBeNull();
  });

  it("returns null when given a plain object", () => {
    expect(validateAppyUrl({})).toBeNull();
  });

  it("returns null for a non-URL string", () => {
    expect(validateAppyUrl("not a url")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(validateAppyUrl("")).toBeNull();
  });

  // Note: URLs with embedded credentials (user:pass@host) are accepted by the
  // current implementation because the URL constructor parses them successfully
  // and they carry the https: protocol. This test documents that behavior.
  // If credential-stripping becomes a security requirement, update this test
  // and add a protocol check in validateAppyUrl.
  it("accepts (does not reject) a URL with embedded credentials — documented behavior", () => {
    const result = validateAppyUrl("https://user:pass@host.example.com/");
    // Currently accepted — the normalized href will contain the credentials.
    expect(typeof result).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// parseViewBounds
// ---------------------------------------------------------------------------

describe("parseViewBounds", () => {
  it("returns the parsed bounds object for a valid input", () => {
    expect(parseViewBounds({ x: 0, y: 0, width: 100, height: 100 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  it("accepts width exactly equal to the minimum (10)", () => {
    expect(parseViewBounds({ x: 0, y: 0, width: 10, height: 100 })).toEqual({
      x: 0,
      y: 0,
      width: 10,
      height: 100,
    });
  });

  it("rejects width below the minimum (9)", () => {
    expect(parseViewBounds({ x: 0, y: 0, width: 9, height: 100 })).toBeNull();
  });

  it("accepts height exactly equal to the minimum (10)", () => {
    expect(parseViewBounds({ x: 0, y: 0, width: 100, height: 10 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 10,
    });
  });

  it("rejects height below the minimum (9)", () => {
    expect(parseViewBounds({ x: 0, y: 0, width: 100, height: 9 })).toBeNull();
  });

  it("rejects negative x", () => {
    expect(parseViewBounds({ x: -1, y: 0, width: 100, height: 100 })).toBeNull();
  });

  it("rejects negative y", () => {
    expect(parseViewBounds({ x: 0, y: -1, width: 100, height: 100 })).toBeNull();
  });

  it("rejects NaN for width", () => {
    expect(parseViewBounds({ x: 0, y: 0, width: NaN, height: 100 })).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseViewBounds(null)).toBeNull();
  });

  it("returns null for a string input", () => {
    expect(parseViewBounds("string")).toBeNull();
  });

  it("returns null for a number input", () => {
    expect(parseViewBounds(42)).toBeNull();
  });

  it("returns null for an empty object (missing all fields)", () => {
    expect(parseViewBounds({})).toBeNull();
  });

  // The implementation coerces values via Number(), so string-coercible numbers
  // (e.g. "100") are converted to their numeric equivalents and accepted.
  // This test documents the current coercion behavior.
  it("accepts string-coercible numbers — documented coercion behavior", () => {
    const result = parseViewBounds({ x: "5", y: "5", width: "100", height: "100" });
    // Currently accepted: Number("100") === 100, etc.
    expect(result).toEqual({ x: 5, y: 5, width: 100, height: 100 });
  });
});
