import { assertEquals } from "./deps.ts";

import { Controller } from "./Controller.ts";
import { getControllerOwnMeta } from "./metadata.ts";
import { ControllerMetadata } from "./types.ts";

Deno.test({
  name: "Controller sets metadata on class",
  fn(): void {
    const prefix: string = "/";
    @Controller(prefix)
    class TestClass {}

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(
      TestClass,
    );
    assertEquals(meta?.prefix, prefix);
    assertEquals(meta?.defaultResponseCodes instanceof Map, true);
    assertEquals(meta?.routes instanceof Map, true);
    assertEquals(meta?.args instanceof Array, true);
  },
});

Deno.test({
  name:
    "Controller sets default prefix on class when no prefix arg is specified",
  fn(): void {
    const defaultPrefix: string = "/";

    @Controller()
    class TestClass {}

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(
      TestClass,
    );

    assertEquals(meta?.prefix, defaultPrefix);
  },
});
