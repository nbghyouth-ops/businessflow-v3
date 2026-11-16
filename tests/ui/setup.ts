import { afterEach, expect } from "vitest";
import * as matchers from "vitest-axe/matchers";
expect.extend(matchers);
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
