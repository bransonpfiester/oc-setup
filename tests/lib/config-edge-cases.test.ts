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

describe("config edge cases", () => {
  describe("readConfig edge cases", () => {
    it("returns {} for empty file content", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("");

      const result = readConfig();

      expect(result).toEqual({});
      expect(logger.error).toHaveBeenCalled();
    });

    it("returns {} for whitespace-only file content", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("   \n\t  ");

      const result = readConfig();

      expect(result).toEqual({});
      expect(logger.error).toHaveBeenCalled();
    });

    it("handles file read errors (permission denied)", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error("EACCES: permission denied");
      });

      const result = readConfig();

      expect(result).toEqual({});
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read config"),
      );
    });

    it("handles very large config file", () => {
      const largeConfig: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeConfig[`key_${i}`] = `value_${i}`;
      }
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(largeConfig));

      const result = readConfig();

      expect(Object.keys(result)).toHaveLength(1000);
    });

    it("returns {} when all optional fields are undefined", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));

      const result = readConfig();

      expect(result).toEqual({});
      expect(result.version).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.telegram).toBeUndefined();
      expect(result.model).toBeUndefined();
      expect(result.gateway).toBeUndefined();
      expect(result.personality).toBeUndefined();
    });
  });

  describe("writeConfig edge cases", () => {
    it("handles empty partial config", () => {
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

    it("handles null values in partial", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: undefined } as OpenClawConfig);

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toBeDefined();
    });

    it("preserves special characters in strings", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({
        user: { name: 'Test "User" <>&' },
      });

      const writtenRaw = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      const written = JSON.parse(writtenRaw);
      expect(written.user.name).toBe('Test "User" <>&');
    });

    it("preserves unicode values", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({
        user: { name: "日本語ユーザー" },
      });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.user.name).toBe("日本語ユーザー");
    });

    it("preserves existing unrelated keys during merge", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          version: "1.0",
          gateway: { port: 3000 },
          telegram: { token: "old-token" },
        }),
      );

      writeConfig({ user: { name: "New" } });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.version).toBe("1.0");
      expect(written.gateway.port).toBe(3000);
      expect(written.telegram.token).toBe("old-token");
      expect(written.user.name).toBe("New");
    });

    it("succeeds after readConfig failure (empty existing)", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("not valid json");

      writeConfig({ version: "2.0" });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toEqual({ version: "2.0" });
    });

    it("handles multiple sequential writes", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      writeConfig({ version: "1.0" });
      const first = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(first).toEqual({ version: "1.0" });

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );

      writeConfig({ user: { name: "Added" } });
      const second = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[1][1] as string,
      );
      expect(second.version).toBe("1.0");
      expect(second.user.name).toBe("Added");
    });
  });

  describe("deepMerge edge cases (via writeConfig)", () => {
    it("handles deeply nested objects (3+ levels)", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          user: { name: "Alice" },
          personality: {
            description: "Original",
            focusAreas: ["Email"],
          },
        }),
      );

      writeConfig({
        personality: { description: "Updated" },
      });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.user.name).toBe("Alice");
      expect(written.personality.description).toBe("Updated");
      expect(written.personality.focusAreas).toEqual(["Email"]);
    });

    it("overwrites when source value is string but target is object", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          user: { name: "Alice", timezone: "UTC" },
        }),
      );

      writeConfig({ user: "replaced" } as unknown as OpenClawConfig);

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.user).toBe("replaced");
    });

    it("handles undefined values in source (skipped by Object.keys)", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0" }),
      );

      writeConfig({ version: undefined } as OpenClawConfig);

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.version).toBeUndefined();
    });

    it("source array replaces target array", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          personality: { focusAreas: ["A", "B", "C"] },
        }),
      );

      writeConfig({
        personality: { focusAreas: ["X"] },
      });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.personality.focusAreas).toEqual(["X"]);
    });

    it("merges identical objects without duplication", () => {
      const config: OpenClawConfig = {
        version: "1.0",
        user: { name: "Same" },
      };
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(config));

      writeConfig(config);

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toEqual(config);
    });

    it("handles null in source overwriting target value", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0", user: { name: "Alice" } }),
      );

      writeConfig({ user: null } as unknown as OpenClawConfig);

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.user).toBeNull();
    });

    it("new keys from source are added to result", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ version: "1.0" }),
      );

      writeConfig({
        user: { name: "New" },
        gateway: { port: 8080 },
      });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.version).toBe("1.0");
      expect(written.user).toEqual({ name: "New" });
      expect(written.gateway).toEqual({ port: 8080 });
    });

    it("empty object source preserves full target", () => {
      const original = {
        version: "2.0",
        user: { name: "Keep", agentName: "Bot" },
        gateway: { port: 3000 },
      };
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(original));

      writeConfig({});

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written).toEqual(original);
    });
  });
});
