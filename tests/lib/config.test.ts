import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("../../src/lib/platform.js", () => ({
  paths: vi.fn(() => ({
    home: "/mock/home",
    openclawDir: "/mock/home/.openclaw",
    configFile: "/mock/home/.openclaw/config.json",
    logsDir: "/mock/home/.openclaw/logs",
    soulFile: "/mock/home/.openclaw/SOUL.md",
    userFile: "/mock/home/.openclaw/USER.md",
    heartbeatFile: "/mock/home/.openclaw/HEARTBEAT.md",
    launchdPlist:
      "/mock/home/Library/LaunchAgents/com.openclaw.gateway.plist",
    systemdUnit:
      "/mock/home/.config/systemd/user/openclaw-gateway.service",
  })),
}));

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  readConfig,
  writeConfig,
  type OpenClawConfig,
} from "../../src/lib/config.js";
import { logger } from "../../src/utils/logger.js";

describe("config", () => {
  describe("readConfig", () => {
    it("returns {} when config file does not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = readConfig();

      expect(result).toEqual({});
    });

    it("parses valid JSON from config file", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "2.0", user: { name: "Alice" } }),
      );

      const result = readConfig();

      expect(result.version).toBe("2.0");
      expect(result.user?.name).toBe("Alice");
    });

    it("returns {} when file contains invalid JSON", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("{invalid json!!}");

      const result = readConfig();

      expect(result).toEqual({});
    });

    it("logs error when JSON parsing fails", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("not json");

      readConfig();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read config"),
      );
    });

    it("reads full config with all fields", () => {
      const fullConfig: OpenClawConfig = {
        version: "2.0.2",
        user: { name: "Test", agentName: "Claw", timezone: "UTC" },
        telegram: { token: "123:abc", botUsername: "testbot" },
        model: {
          provider: "anthropic",
          apiKey: "sk-test",
          modelId: "claude-sonnet-4-5-20250514",
        },
        gateway: { port: 3000, pid: 12345 },
        personality: {
          description: "Helpful",
          focusAreas: ["Research"],
        },
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(fullConfig));

      const result = readConfig();

      expect(result).toEqual(fullConfig);
    });

    it("reads configFile path from paths()", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      readConfig();

      expect(existsSync).toHaveBeenCalledWith(
        "/mock/home/.openclaw/config.json",
      );
    });
  });

  describe("writeConfig", () => {
    it("creates directory with recursive option", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: "1.0" });

      expect(mkdirSync).toHaveBeenCalledWith("/mock/home/.openclaw", {
        recursive: true,
      });
    });

    it("merges partial config with existing config", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0", user: { name: "Alice" } }),
      );

      writeConfig({ user: { timezone: "UTC" } });

      const writtenData = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const written = JSON.parse(writtenData);
      expect(written.version).toBe("1.0");
      expect(written.user.name).toBe("Alice");
      expect(written.user.timezone).toBe("UTC");
    });

    it("writes valid JSON with indentation", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: "1.0" });

      const writtenData = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      expect(() => JSON.parse(writtenData)).not.toThrow();
      expect(writtenData).toContain("  ");
      expect(writtenData.endsWith("\n")).toBe(true);
    });

    it("writes to the correct file path", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: "1.0" });

      expect(writeFileSync).toHaveBeenCalledWith(
        "/mock/home/.openclaw/config.json",
        expect.any(String),
        "utf-8",
      );
    });

    it("calls logger.info on success", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: "1.0" });

      expect(logger.info).toHaveBeenCalledWith("Config written successfully");
    });

    it("writes config with all fields", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const full: OpenClawConfig = {
        version: "2.0",
        user: { name: "Test", agentName: "Claw", timezone: "EST" },
        telegram: { token: "tok", botUsername: "bot" },
        model: { provider: "openai", apiKey: "key", modelId: "gpt-4o" },
        gateway: { port: 8080, pid: 999 },
        personality: { description: "Kind", focusAreas: ["Research"] },
      };

      writeConfig(full);

      const writtenData = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const written = JSON.parse(writtenData);
      expect(written).toEqual(full);
    });
  });

  describe("deepMerge (via writeConfig)", () => {
    it("merges flat objects", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0" }),
      );

      writeConfig({ user: { name: "Test" } });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toEqual({ version: "1.0", user: { name: "Test" } });
    });

    it("deep merges nested objects", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          user: { name: "Alice", timezone: "UTC" },
        }),
      );

      writeConfig({ user: { name: "Bob" } });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.user.name).toBe("Bob");
      expect(written.user.timezone).toBe("UTC");
    });

    it("overwrites arrays instead of merging them", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          personality: { focusAreas: ["Email", "Calendar"] },
        }),
      );

      writeConfig({
        personality: { focusAreas: ["Research"] },
      });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.personality.focusAreas).toEqual(["Research"]);
    });

    it("handles empty target (no existing config)", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: "1.0" });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toEqual({ version: "1.0" });
    });

    it("handles empty source (empty partial)", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0" }),
      );

      writeConfig({});

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toEqual({ version: "1.0" });
    });

    it("does not mutate the partial input", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0" }),
      );

      const partial: OpenClawConfig = { user: { name: "Test" } };
      const copy = JSON.parse(JSON.stringify(partial));

      writeConfig(partial);

      expect(partial).toEqual(copy);
    });
  });

  describe("config roundtrip", () => {
    it("write then read returns same data", () => {
      let storedData = "";
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(writeFileSync).mockImplementation((_, data) => {
        storedData = data as string;
      });

      const input: OpenClawConfig = {
        version: "1.0",
        user: { name: "Roundtrip" },
      };
      writeConfig(input);

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(storedData);

      const result = readConfig();
      expect(result).toEqual(input);
    });
  });
});
