function normalizeMcpUrl(rawUrl: string) {
  if (rawUrl.startsWith("sse://")) {
    return new URL(`http://${rawUrl.slice("sse://".length)}`);
  }

  if (rawUrl.startsWith("sse+https://")) {
    return new URL(rawUrl.replace("sse+https://", "https://"));
  }

  if (rawUrl.startsWith("sse+http://")) {
    return new URL(rawUrl.replace("sse+http://", "http://"));
  }

  return new URL(rawUrl);
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  if (octets[0] === 10 || octets[0] === 127) {
    return true;
  }

  if (octets[0] === 192 && octets[1] === 168) {
    return true;
  }

  if (octets[0] === 169 && octets[1] === 254) {
    return true;
  }

  return octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31;
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "host.docker.internal" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (isPrivateIpv4(normalized) || isPrivateIpv6(normalized)) {
    return true;
  }

  return !normalized.includes(".") && normalized !== "";
}

export function isHostedRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_URL || process.env.VERCEL_ENV);
}

export function isLocalBrowserRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getHostedMcpRestrictionReason(rawUrl: string, hosted: boolean) {
  if (!hosted) {
    return null;
  }

  try {
    const url = normalizeMcpUrl(rawUrl);

    if (!isPrivateHostname(url.hostname)) {
      return null;
    }

    return "This MCP server uses localhost or a private network address. On Vercel, Gliss runs in the cloud, so only publicly reachable MCP endpoints will work.";
  } catch {
    return null;
  }
}
