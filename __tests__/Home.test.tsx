import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import Page from "../app/page";

type MockResponse = {
  ok: boolean;
  json: () => Promise<{
    status: { state: string; timestamp: string };
    logs: string[];
  }>;
};

type EventHandler = (event: Event | MessageEvent<string>) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  public readonly url: string;
  public readyState = 0;
  private readonly listeners = new Map<string, Set<EventHandler>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventHandler) {
    const handlers = this.listeners.get(type) ?? new Set<EventHandler>();
    handlers.add(listener);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type: string, listener: EventHandler) {
    this.listeners.get(type)?.delete(listener);
  }

  close() {
    this.readyState = 2;
  }

  emitSnapshot(payload: unknown) {
    const handlers = this.listeners.get("snapshot");
    if (!handlers) {
      return;
    }
    const event = { data: JSON.stringify(payload) } as MessageEvent<string>;
    handlers.forEach((handler) => handler(event));
  }

  emitError() {
    const handlers = this.listeners.get("error");
    if (!handlers) {
      return;
    }
    const event = new Event("error");
    handlers.forEach((handler) => handler(event));
  }

  static reset() {
    MockEventSource.instances = [];
  }
}

const fetchMock = vi.fn<() => Promise<MockResponse>>();

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });

  const storage = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    },
  });

  Object.defineProperty(window, "EventSource", {
    configurable: true,
    writable: true,
    value: MockEventSource,
  });

  vi.stubGlobal("EventSource", MockEventSource);
  vi.stubGlobal("fetch", fetchMock);
});

describe("Teams Dashboard Setup", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "";
    MockEventSource.reset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: { state: "idle", timestamp: "2026-02-07T09:00:00Z" },
        logs: ["watcher running"],
      }),
    });
  });

  it("renders the dashboard heading", async () => {
    render(<Page />);
    expect(await screen.findByText(/teams watcher/i)).toBeTruthy();
  });

  it("loads and applies saved theme preference", async () => {
    window.localStorage.setItem("teams-recorder-theme", "light");
    render(<Page />);
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
  });

  it("toggles theme when toggle button is clicked", async () => {
    render(<Page />);
    const themeToggle = await screen.findByLabelText(/toggle theme/i);
    fireEvent.click(themeToggle);
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });
    fireEvent.click(themeToggle);
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("dark");
    });
  });

  it("subscribes to status stream and applies snapshot updates", async () => {
    render(<Page />);
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const stream = MockEventSource.instances[0];
    expect(stream.url).toContain("/api/status/stream?lines=50");

    act(() => {
      stream.emitSnapshot({
        status: { state: "recording", timestamp: "2026-02-11T10:00:00Z" },
        logs: ["live stream update"],
        meta: { lines: 50, bytes: 65536 },
      });
    });
    await waitFor(() => {
      expect(screen.getByText("2026-02-11T10:00:00Z")).toBeTruthy();
      expect(screen.getByText("live stream update")).toBeTruthy();
    });
  });

  it("falls back to fetch when EventSource is unavailable", async () => {
    const originalEventSource = window.EventSource;
    try {
      Object.defineProperty(window, "EventSource", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      render(<Page />);
      await waitFor(() => {
        expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
      expect(MockEventSource.instances.length).toBe(0);
    } finally {
      Object.defineProperty(window, "EventSource", {
        configurable: true,
        writable: true,
        value: originalEventSource,
      });
    }
  });
});
