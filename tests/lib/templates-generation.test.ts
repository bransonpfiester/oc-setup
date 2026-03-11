import { describe, it, expect } from "vitest";
import {
  generateSoulMd,
  generateUserMd,
  generateHeartbeatMd,
  type TemplateInputs,
} from "../../src/lib/templates.js";

function makeInputs(overrides: Partial<TemplateInputs> = {}): TemplateInputs {
  return {
    userName: "TestUser",
    agentName: "TestAgent",
    timezone: "UTC",
    personalityDescription: "Helpful and kind.",
    focusAreas: ["Research"],
    ...overrides,
  };
}

describe("templates generation", () => {
  describe("generateSoulMd variations", () => {
    it("handles empty focus areas array", () => {
      const output = generateSoulMd(makeInputs({ focusAreas: [] }));
      expect(output).toContain("# SOUL.md");
      expect(output).toContain("## Focus Areas");
      const focusSection = output.split("## Focus Areas")[1].split("## Boundaries")[0];
      expect(focusSection.trim()).toBe("");
    });

    it("handles many focus areas", () => {
      const areas = [
        "Email monitoring",
        "Calendar management",
        "Research",
        "Writing",
        "Social media",
        "Code/development",
      ];
      const output = generateSoulMd(makeInputs({ focusAreas: areas }));

      for (const area of areas) {
        expect(output).toContain(`- ${area}`);
      }
    });

    it("handles special characters in user name", () => {
      const output = generateSoulMd(
        makeInputs({ userName: "O'Brien & Partners" }),
      );
      expect(output).toContain("O'Brien & Partners");
      expect(output).toContain("ask O'Brien & Partners");
    });

    it("includes Core section with personality", () => {
      const output = generateSoulMd(
        makeInputs({ personalityDescription: "Very precise." }),
      );
      expect(output).toContain("## Core");
      expect(output).toContain("- Very precise.");
    });

    it("includes boundaries section", () => {
      const output = generateSoulMd(makeInputs());
      expect(output).toContain("## Boundaries");
      expect(output).toContain("Ask before sending anything external");
      expect(output).toContain("Private info stays private");
    });

    it("includes proactive behavior instruction", () => {
      const output = generateSoulMd(makeInputs());
      expect(output).toContain("proactive");
    });

    it("handles unicode characters in user name", () => {
      const output = generateSoulMd(makeInputs({ userName: "名前テスト" }));
      expect(output).toContain("名前テスト");
      expect(output).toContain("ask 名前テスト");
    });

    it("output is valid markdown with headings", () => {
      const output = generateSoulMd(makeInputs());
      const headings = output.match(/^#{1,3} .+$/gm) ?? [];
      expect(headings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("generateUserMd variations", () => {
    it("includes all provided fields", () => {
      const output = generateUserMd(
        makeInputs({
          userName: "Full User",
          agentName: "FullAgent",
          timezone: "Asia/Tokyo",
          focusAreas: ["Research", "Writing"],
        }),
      );
      expect(output).toContain("Full User");
      expect(output).toContain("FullAgent");
      expect(output).toContain("Asia/Tokyo");
      expect(output).toContain("Research, Writing");
    });

    it("handles empty timezone", () => {
      const output = generateUserMd(makeInputs({ timezone: "" }));
      expect(output).toContain("**Timezone:**");
      expect(output).toContain("# USER.md");
    });

    it("focus areas are joined with comma and space", () => {
      const output = generateUserMd(
        makeInputs({ focusAreas: ["A", "B", "C"] }),
      );
      expect(output).toContain("A, B, C");
    });

    it("single focus area has no commas", () => {
      const output = generateUserMd(
        makeInputs({ focusAreas: ["Only One"] }),
      );
      expect(output).toContain("Only One");
      expect(output).not.toMatch(/Only One,/);
    });

    it("output contains markdown bold markers", () => {
      const output = generateUserMd(makeInputs());
      const boldMatches = output.match(/\*\*[^*]+\*\*/g) ?? [];
      expect(boldMatches.length).toBeGreaterThanOrEqual(4);
    });

    it("output is valid markdown", () => {
      const output = generateUserMd(makeInputs());
      expect(output.startsWith("# USER.md")).toBe(true);
      expect(output).toContain("- **");
    });

    it("handles long agent name", () => {
      const longName = "A".repeat(200);
      const output = generateUserMd(makeInputs({ agentName: longName }));
      expect(output).toContain(longName);
    });
  });

  describe("generateHeartbeatMd per focus area", () => {
    it("generates email monitoring check", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Email monitoring"] }),
      );
      expect(output).toContain("Check inbox for urgent emails");
      expect(output).toContain("attention");
    });

    it("generates calendar management check", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Calendar management"] }),
      );
      expect(output).toContain("Check calendar");
      expect(output).toContain("4 hours");
    });

    it("generates social media check", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Social media"] }),
      );
      expect(output).toContain("social media mentions");
    });

    it("generates code/development check", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Code/development"] }),
      );
      expect(output).toContain("failed builds");
      expect(output).toContain("critical alerts");
    });

    it("generates research check", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Research"] }),
      );
      expect(output).toContain("pending research");
    });

    it("generates writing check", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Writing"] }),
      );
      expect(output).toContain("writing deadlines");
    });

    it("generates fallback check for unknown/custom focus area", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Custom task tracking"] }),
      );
      expect(output).toContain("Check on Custom task tracking tasks");
    });

    it("combines all focus areas into one output", () => {
      const areas = [
        "Email monitoring",
        "Calendar management",
        "Social media",
        "Code/development",
        "Research",
        "Writing",
      ];
      const output = generateHeartbeatMd(makeInputs({ focusAreas: areas }));

      expect(output).toContain("inbox");
      expect(output).toContain("calendar");
      expect(output).toContain("social media");
      expect(output).toContain("builds");
      expect(output).toContain("research");
      expect(output).toContain("deadlines");
      expect(output).toContain("HEARTBEAT_OK");
    });

    it("always ends with HEARTBEAT_OK instruction", () => {
      const output = generateHeartbeatMd(makeInputs());
      const lines = output.trim().split("\n");
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toContain("HEARTBEAT_OK");
    });

    it("heading is present regardless of focus areas", () => {
      const output = generateHeartbeatMd(makeInputs({ focusAreas: [] }));
      expect(output).toContain("# HEARTBEAT.md");
    });

    it("focus area matching is case-insensitive", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["EMAIL MONITORING"] }),
      );
      expect(output).toContain("inbox");
    });

    it("output is valid markdown", () => {
      const output = generateHeartbeatMd(makeInputs());
      expect(output.startsWith("# HEARTBEAT.md")).toBe(true);
    });

    it("each focus area produces a separate line", () => {
      const areas = ["Email monitoring", "Research"];
      const output = generateHeartbeatMd(makeInputs({ focusAreas: areas }));
      const lines = output
        .split("\n")
        .filter((l) => l.length > 0 && !l.startsWith("#"));
      expect(lines.length).toBeGreaterThanOrEqual(areas.length);
    });
  });
});
