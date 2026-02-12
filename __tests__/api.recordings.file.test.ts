// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("/api/recordings/[name]", () => {
  it("rejects path traversal names", async () => {
    const { GET } = await import("@/app/api/recordings/[name]/route");
    const res = await GET(
      new Request("http://localhost:3000/api/recordings/%2E%2E%2Fsecret.m4a", {
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ name: "../secret.m4a" }) },
    );
    expect(res.status).toBe(400);
  });

  it("rejects unsupported extensions", async () => {
    const { GET } = await import("@/app/api/recordings/[name]/route");
    const res = await GET(
      new Request("http://localhost:3000/api/recordings/file.txt", {
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ name: "file.txt" }) },
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for missing recording files", async () => {
    const { GET } = await import("@/app/api/recordings/[name]/route");
    const res = await GET(
      new Request("http://localhost:3000/api/recordings/missing.m4a", {
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ name: "missing.m4a" }) },
    );
    expect(res.status).toBe(404);
  });
});
