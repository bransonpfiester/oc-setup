import { describe, it, expect } from "vitest";
import {
  PRESETS,
  getPreset,
  generateSoulMd,
  generateUserMd,
  generateHeartbeatMd,
  type TemplateInputs,
  type PersonalityPreset,
} from "../../src/lib/templates.js";

function makeInputs(overrides: Partial<TemplateInputs> = {}): TemplateInputs {
  return {
    userName: "Alice",
    agentName: "Claw",
    timezone: "America/New_York",
    personalityDescription: "Friendly and helpful.",
    focusAreas: ["Email monitoring", "Research"],
    ...overrides,
  };
}

describe("templates", () => {
  describe("PRESETS", () => {
    it("has exactly 4 entries", () => {
      expect(PRESETS).toHaveLength(4);
    });

    it("includes business preset", () => {
      const biz = PRESETS.find((p) => p.key === "business");
      expect(biz).toBeDefined();
      expect(biz!.label).toBe("Business");
    });

    it("includes creative preset", () => {
      const creative = PRESETS.find((p) => p.key === "creative");
      expect(creative).toBeDefined();
      expect(creative!.label).toBe("Creative");
    });

    it("includes developer preset", () => {
      const dev = PRESETS.find((p) => p.key === "developer");
      expect(dev).toBeDefined();
      expect(dev!.label).toBe("Developer");
    });

    it("includes general preset", () => {
      const general = PRESETS.find((p) => p.key === "general");
      expect(general).toBeDefined();
      expect(general!.label).toBe("General");
    });

    it("each preset has key, label, description, and focusAreas", () => {
      for (const preset of PRESETS) {
        expect(preset).toHaveProperty("key");
        expect(preset).toHaveProperty("label");
        expect(preset).toHaveProperty("description");
        expect(preset).toHaveProperty("focusAreas");
        expect(typeof preset.key).toBe("string");
        expect(typeof preset.label).toBe("string");
        expect(typeof preset.description).toBe("string");
        expect(Array.isArray(preset.focusAreas)).toBe(true);
      }
    });

    it("all preset keys are unique", () => {
      const keys = PRESETS.map((p) => p.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("all preset descriptions are non-empty", () => {
      for (const preset of PRESETS) {
        expect(preset.description.length).toBeGreaterThan(0);
      }
    });

    it("all presets have at least one focus area", () => {
      for (const preset of PRESETS) {
        expect(preset.focusAreas.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("getPreset", () => {
    it("returns correct preset for business", () => {
      const result = getPreset("business");
      expect(result).toBeDefined();
      expect(result!.key).toBe("business");
      expect(result!.label).toBe("Business");
      expect(result!.focusAreas).toContain("Email monitoring");
    });

    it("returns correct preset for creative", () => {
      const result = getPreset("creative");
      expect(result).toBeDefined();
      expect(result!.key).toBe("creative");
      expect(result!.focusAreas).toContain("Writing");
    });

    it("returns correct preset for developer", () => {
      const result = getPreset("developer");
      expect(result).toBeDefined();
      expect(result!.key).toBe("developer");
      expect(result!.focusAreas).toContain("Code/development");
    });

    it("returns correct preset for general", () => {
      const result = getPreset("general");
      expect(result).toBeDefined();
      expect(result!.key).toBe("general");
      expect(result!.focusAreas).toContain("Research");
    });

    it("returns undefined for unknown key", () => {
      const result = getPreset("nonexistent");
      expect(result).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      const result = getPreset("");
      expect(result).toBeUndefined();
    });
  });

  describe("generateSoulMd", () => {
    it("contains SOUL.md heading", () => {
      const output = generateSoulMd(makeInputs());
      expect(output).toContain("# SOUL.md");
    });

    it("includes user name", () => {
      const output = generateSoulMd(makeInputs({ userName: "Bob" }));
      expect(output).toContain("Bob");
    });

    it("includes all focus areas as bullet points", () => {
      const output = generateSoulMd(
        makeInputs({ focusAreas: ["Email monitoring", "Calendar management"] }),
      );
      expect(output).toContain("- Email monitoring");
      expect(output).toContain("- Calendar management");
    });

    it("includes personality description", () => {
      const output = generateSoulMd(
        makeInputs({ personalityDescription: "Direct and efficient." }),
      );
      expect(output).toContain("Direct and efficient.");
    });

    it("includes boundaries section", () => {
      const output = generateSoulMd(makeInputs());
      expect(output).toContain("## Boundaries");
      expect(output).toContain("Ask before sending");
      expect(output).toContain("Private info stays private");
    });

    it("includes Focus Areas section heading", () => {
      const output = generateSoulMd(makeInputs());
      expect(output).toContain("## Focus Areas");
    });

    it("references user name in boundaries", () => {
      const output = generateSoulMd(makeInputs({ userName: "Charlie" }));
      expect(output).toContain("ask Charlie");
    });
  });

  describe("generateUserMd", () => {
    it("contains USER.md heading", () => {
      const output = generateUserMd(makeInputs());
      expect(output).toContain("# USER.md");
    });

    it("includes name and timezone", () => {
      const output = generateUserMd(
        makeInputs({ userName: "Diana", timezone: "Europe/London" }),
      );
      expect(output).toContain("Diana");
      expect(output).toContain("Europe/London");
    });

    it("includes agent name as preferred name", () => {
      const output = generateUserMd(makeInputs({ agentName: "MyClaw" }));
      expect(output).toContain("MyClaw");
    });

    it("includes focus areas as comma-separated list", () => {
      const output = generateUserMd(
        makeInputs({ focusAreas: ["A", "B", "C"] }),
      );
      expect(output).toContain("A, B, C");
    });

    it("includes markdown bold formatting", () => {
      const output = generateUserMd(makeInputs());
      expect(output).toContain("**Name:**");
      expect(output).toContain("**Timezone:**");
      expect(output).toContain("**Preferred name:**");
      expect(output).toContain("**Focus areas:**");
    });
  });

  describe("generateHeartbeatMd", () => {
    it("contains HEARTBEAT.md heading", () => {
      const output = generateHeartbeatMd(makeInputs());
      expect(output).toContain("# HEARTBEAT.md");
    });

    it("includes HEARTBEAT_OK sentinel", () => {
      const output = generateHeartbeatMd(makeInputs());
      expect(output).toContain("HEARTBEAT_OK");
    });

    it("generates checks for email monitoring focus", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Email monitoring"] }),
      );
      expect(output).toContain("inbox");
    });

    it("generates checks for calendar management focus", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Calendar management"] }),
      );
      expect(output).toContain("calendar");
    });

    it("generates check for research focus", () => {
      const output = generateHeartbeatMd(
        makeInputs({ focusAreas: ["Research"] }),
      );
      expect(output).toContain("research");
    });
  });
});
