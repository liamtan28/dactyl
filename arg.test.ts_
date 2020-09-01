// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals } from "./deps.ts";
import { defineParameterDecorator, Param, Body, Query, Header } from "./arg.ts";
import { Get } from "./method.ts";
import { getControllerOwnMeta } from "./metadata.ts";
import { ControllerMetadata, RouteArgument, ArgsType } from "./types.ts";

const TEST_ARG_TYPE: ArgsType = ArgsType.PARAM;
const TestDecorator = (key: string) => defineParameterDecorator(TEST_ARG_TYPE, key);

Deno.test({
  name: "Arg decorator appropriately applies default metadata if class is Newable non-controller",
  fn(): void {
    class TestClass {
      @Get()
      public testAction(@TestDecorator("id") id: any): void {}
    }

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
    assertEquals(meta?.prefix, null);
    assertEquals(meta?.defaultResponseCodes instanceof Map, true);
    assertEquals(meta?.routes instanceof Map, true);
    assertEquals(meta?.args instanceof Array, true);
  },
});

Deno.test({
  name: "Arg decorator adds correct argument metadata to parent controller",
  fn(): void {
    const key: string = "id";
    const actionName: string = "testAction";
    class TestClass {
      @Get()
      public [actionName](@TestDecorator(key) id: any): void {}
    }

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
    const appliedArg: RouteArgument | undefined = meta?.args[0];
    assertEquals(appliedArg?.type, TEST_ARG_TYPE);
    assertEquals(appliedArg?.key, key);
    assertEquals(appliedArg?.argFor, actionName);
    assertEquals(appliedArg?.index, 0);
  },
});

Deno.test({
  name: "@Param decorator should allow no key passed",
  fn(): void {
    class TestClass {
      @Get()
      public testAction(@Param() params: Object): void {}
    }
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
    assertEquals(meta?.args[0].key, undefined);
  },
});

Deno.test({
  name: "@Body decorator should allow no key passed",
  fn(): void {
    class TestClass {
      @Get()
      public testAction(@Body() body: Object): void {}
    }
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
    assertEquals(meta?.args[0].key, undefined);
  },
});

Deno.test({
  name: "@Query decorator should allow no key passed",
  fn(): void {
    class TestClass {
      @Get()
      public testAction(@Query() query: Object): void {}
    }
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
    assertEquals(meta?.args[0].key, undefined);
  },
});

Deno.test({
  name: "@Header decorator should allow no key passed",
  fn(): void {
    class TestClass {
      @Get()
      public testAction(@Header() headers: Object): void {}
    }
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
    assertEquals(meta?.args[0].key, undefined);
  },
});
