import { assertEquals } from "./deps.ts";
import { retrieveFromContext, buildRouteArgumentsFromMeta, getStatus } from "./transform.ts";

Deno.test({
  name: "Test true to be true",
  fn() {
    assertEquals(true, true);
  },
});
