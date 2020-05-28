// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals } from "./deps.ts";
import { HttpStatus } from "./HttpStatus.ts";
import { ControllerMetadata } from "./types.ts";
import { getControllerOwnMeta } from "./metadata.ts";

Deno.test({
  name:
    "HttpStatus decorator should apply default metadata to Newable non-controller class",
  fn(): void {
    class TestClass {
      @HttpStatus(200)
      public testAction() {}
    }

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(
      TestClass,
    );

    assertEquals(meta?.prefix, null);
    assertEquals(meta?.defaultResponseCodes instanceof Map, true);
    assertEquals(meta?.routes instanceof Map, true);
    assertEquals(meta?.args instanceof Array, true);
  },
});

Deno.test({
  name:
    "HttpStatus decorator should apply defaultResponseCode metadata to class",
  fn(): void {
    const actionName: string = "testAction";
    const code: number = 200;
    class TestClass {
      @HttpStatus(code)
      public [actionName]() {}
    }

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(
      TestClass,
    );
    const responseCodeMeta: number | undefined = meta?.defaultResponseCodes.get(
      actionName,
    );

    assertEquals(responseCodeMeta, code);
  },
});
