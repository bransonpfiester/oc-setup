import { vi } from "vitest";

export function createMockClack() {
  const spinner = {
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  };

  return {
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    note: vi.fn(),
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      step: vi.fn(),
      message: vi.fn(),
    },
    spinner: vi.fn(() => spinner),
    text: vi.fn(),
    select: vi.fn(),
    multiselect: vi.fn(),
    confirm: vi.fn(),
    isCancel: vi.fn(() => false),
    _spinner: spinner,
  };
}

export type MockClack = ReturnType<typeof createMockClack>;
