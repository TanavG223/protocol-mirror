const BASE_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "media-src 'none'",
  "worker-src 'self' blob:",
];

export function contentSecurityPolicy(isDevelopment: boolean) {
  const directives = [...BASE_DIRECTIVES];
  if (isDevelopment) directives[1] += " 'unsafe-eval'";
  else directives.push("upgrade-insecure-requests");
  return `${directives.join("; ")};`;
}

export function securityHeaders(isDevelopment: boolean) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(isDevelopment) },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
  ];
}
