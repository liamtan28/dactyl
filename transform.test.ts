// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals, Context, RouterContext } from "./deps.ts";
import { retrieveFromContext, buildRouteArgumentsFromMeta, getStatus } from "./transform.ts";
import { createMockContext, MockContextOptions } from "./utils.ts";

async function retreiveFromMockContext(
  options: MockContextOptions = {}
): Promise<{
  params: any;
  headers: any;
  query: any;
  body: any;
}> {
  const context: Context = createMockContext(options);
  return await retrieveFromContext(<RouterContext>context);
}

Deno.test({
  name: "retreiveFromMockContext returns query parameters from context",
  async fn() {
    const key = "foo";
    const value = "bar";
    const { query } = await retreiveFromMockContext({ path: "/?foo=bar" });
    assertEquals(query[key], value);
  },
});
Deno.test({
  name: "retreiveFromMockContext returns params from context",
  async fn() {
    const key = "foo";
    const value = "bar";
    const { params } = await retreiveFromMockContext({ path: "/", params: { [key]: value } });
    assertEquals(params[key], value);
  },
});
// Would usually test for `Body` retrieval here but no way to set it in mock,
// without importing a fair amount of code from Oak. Unfortunate.

Deno.test({
  name: "retreiveFromMockContext returns headers from context",
  async fn() {
    const { headers } = await retreiveFromMockContext({ path: "/" });
    console.log(headers);
    assertEquals(headers, {});
  },
});
