import { describe, expect, it } from "vitest";
import { timeAgo } from "./sales";

describe("heure des dernières ventes", () => {
  it("dit depuis combien de temps", () => {
    const now = new Date(2026, 9, 31, 18, 0).getTime();
    expect(timeAgo(now - 20_000, now)).toBe("À l'instant");
    expect(timeAgo(now - 3 * 60_000, now)).toBe("Il y a 3 min");
    expect(timeAgo(now - 125 * 60_000, now)).toBe("Il y a 2 h");
    expect(timeAgo(new Date(2026, 9, 31, 8, 5).getTime(), now)).toBe("À 08:05");
  });
});
