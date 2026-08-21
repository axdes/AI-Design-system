import { describe, it, expect } from "vitest";
import { ago, dayLabel, plural, timeOfDay } from './relativeTime';

const NOW = Date.parse("2026-08-05T12:00:00Z");

describe("ago", () => {
  it("says never when there is no date, which is what an unsummarised chat has", () => {
    expect(ago(null, NOW)).toBe("never");
    expect(ago(undefined, NOW)).toBe("never");
    expect(ago("not a date", NOW)).toBe("never");
  });

  it("counts up through minutes, hours and days", () => {
    expect(ago("2026-08-05T11:59:30Z", NOW)).toBe("just now");
    expect(ago("2026-08-05T11:48:00Z", NOW)).toBe("12 min ago");
    expect(ago("2026-08-05T09:00:00Z", NOW)).toBe("3 h ago");
    expect(ago("2026-08-04T09:00:00Z", NOW)).toBe("yesterday");
    expect(ago("2026-08-02T09:00:00Z", NOW)).toBe("3 days ago");
  });

  it("falls back to a date once a week has passed", () => {
    expect(ago("2026-06-01T09:00:00Z", NOW)).toMatch(/2026/);
  });

  it("treats a clock that is slightly ahead as now, not as the future", () => {
    expect(ago("2026-08-05T12:00:30Z", NOW)).toBe("just now");
  });
});

describe("dayLabel", () => {
  it("names today and yesterday, and dates anything older", () => {
    expect(dayLabel("2026-08-05T08:00:00Z", NOW)).toBe("Today");
    expect(dayLabel("2026-08-04T08:00:00Z", NOW)).toBe("Yesterday");
    expect(dayLabel("2026-07-30T08:00:00Z", NOW)).toMatch(/Jul/);
  });

  it("says nothing for a date it cannot read", () => {
    expect(dayLabel("nonsense", NOW)).toBe("");
  });
});

describe("timeOfDay", () => {
  it("is empty rather than 'Invalid Date' when the input is broken", () => {
    expect(timeOfDay("nonsense")).toBe("");
    expect(timeOfDay("2026-08-05T09:05:00Z")).toMatch(/\d/);
  });
});

describe("plural", () => {
  it("agrees with the number", () => {
    expect(plural(1, "message")).toBe("1 message");
    expect(plural(0, "message")).toBe("0 messages");
    expect(plural(14, "message")).toBe("14 messages");
    expect(plural(2, "summary", "summaries")).toBe("2 summaries");
  });
});
