type GuardResult =
  | { ok: true }
  | { ok: false; error: string };

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHost(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function parseHostHeader(hostHeader: string): { hostname: string; port: string | null } | null {
  const value = hostHeader.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("[")) {
    const closing = value.indexOf("]");
    if (closing === -1) {
      return null;
    }

    const hostname = value.slice(1, closing);
    const portPart = value.slice(closing + 1);
    if (!portPart) {
      return { hostname, port: null };
    }
    if (!portPart.startsWith(":")) {
      return null;
    }
    return { hostname, port: portPart.slice(1) || null };
  }

  const firstColon = value.indexOf(":");
  const lastColon = value.lastIndexOf(":");

  if (firstColon !== -1 && firstColon === lastColon) {
    return {
      hostname: value.slice(0, firstColon),
      port: value.slice(firstColon + 1) || null,
    };
  }

  return { hostname: value, port: null };
}

function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(normalizeHost(hostname));
}

function effectivePort(protocol: string, port: string): string {
  if (port) {
    return port;
  }
  return protocol === "https:" ? "443" : "80";
}

export function requireTrustedLocalRequest(req: Request): GuardResult {
  const hostHeader = req.headers.get("host");
  const originHeader = req.headers.get("origin");

  if (!hostHeader || !originHeader) {
    return { ok: false, error: "Forbidden: local same-origin requests only" };
  }

  const parsedHost = parseHostHeader(hostHeader);
  if (!parsedHost || !isLoopbackHost(parsedHost.hostname)) {
    return { ok: false, error: "Forbidden: local same-origin requests only" };
  }

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return { ok: false, error: "Forbidden: local same-origin requests only" };
  }

  if ((origin.protocol !== "http:" && origin.protocol !== "https:") || !isLoopbackHost(origin.hostname)) {
    return { ok: false, error: "Forbidden: local same-origin requests only" };
  }

  const requestPort = effectivePort(origin.protocol, parsedHost.port ?? "");
  const originPort = effectivePort(origin.protocol, origin.port);

  if (normalizeHost(parsedHost.hostname) !== normalizeHost(origin.hostname) || requestPort !== originPort) {
    return { ok: false, error: "Forbidden: local same-origin requests only" };
  }

  return { ok: true };
}
