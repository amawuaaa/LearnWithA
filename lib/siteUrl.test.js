import { describe, expect, it, vi, afterEach } from "vitest";
import {
  SITE_URL_PRODUCCION,
  getPublicSiteUrl,
  urlCallbackRecuperarPassword,
} from "./siteUrl";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPublicSiteUrl", () => {
  it("usa NEXT_PUBLIC_SITE_URL si no es localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://learn-with-a.vercel.app/");
    expect(getPublicSiteUrl()).toBe("https://learn-with-a.vercel.app");
  });

  it("no usa localhost de la env y cae a producción", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(getPublicSiteUrl()).toBe(SITE_URL_PRODUCCION);
  });

  it("arma el callback de recuperación en producción", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(urlCallbackRecuperarPassword()).toBe(
      `${SITE_URL_PRODUCCION}/auth/callback?next=/actualizar-password`,
    );
  });
});
