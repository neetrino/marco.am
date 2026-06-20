import { describe, expect, it } from "vitest";

import {
  parseAdminBootstrapPaths,
  ADMIN_BOOTSTRAP_PATHS,
} from "./admin-bootstrap.service";

describe("parseAdminBootstrapPaths", () => {
  it("returns empty array for blank input", () => {
    expect(parseAdminBootstrapPaths(null)).toEqual([]);
    expect(parseAdminBootstrapPaths("")).toEqual([]);
    expect(parseAdminBootstrapPaths("   ")).toEqual([]);
  });

  it("parses known paths and ignores unknown duplicates", () => {
    expect(parseAdminBootstrapPaths("dashboard,quick-settings,unknown,dashboard")).toEqual([
      "dashboard",
      "quick-settings",
    ]);
  });

  it("covers all supported paths", () => {
    expect(parseAdminBootstrapPaths(ADMIN_BOOTSTRAP_PATHS.join(","))).toEqual([
      ...ADMIN_BOOTSTRAP_PATHS,
    ]);
  });
});
