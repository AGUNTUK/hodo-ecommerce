import { describe, expect, test } from "vitest";
import { getHealth } from "../api/health";

describe("health API", () => {
  test("returns ok payload with expected shape", () => {
    const payload = getHealth();
    expect(payload.ok).toBe(true);
    expect(payload.service).toBe("hodo-api");
    expect(typeof payload.timestamp).toBe("string");
    expect(["production", "preview", "development"]).toContain(payload.env);
  });
});
