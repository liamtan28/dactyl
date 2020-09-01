// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals } from "./deps.ts";
import { Reflect } from "./lib/reflect.ts";

import {
  CONTROLLER_META_PROPKEY,
  getControllerOwnMeta,
  getControllerMeta,
  setControllerOwnMeta,
  setControllerMeta,
} from "./metadata.ts";
import { ControllerMetadata } from "./types.ts";
import { from } from "https://deno.land/x/evt@1.8.0/lib/Evt.from.ts";

Deno.test({
  name: "setControllerOwnMeta should assign metadata to the controller meta key",
  fn(): void {
    class TestClass {}
    const testMeta: ControllerMetadata = ("TEST" as unknown) as ControllerMetadata;

    setControllerOwnMeta(TestClass, testMeta);
    assertEquals(Reflect.getMetadata(CONTROLLER_META_PROPKEY, TestClass), testMeta);
  },
});

Deno.test({
  name: "getControllerOwnMeta should retreive metadata from controller meta key",
  fn(): void {
    class TestClass {}
    const testMeta: ControllerMetadata = ("TEST" as unknown) as ControllerMetadata;

    Reflect.defineMetadata(CONTROLLER_META_PROPKEY, testMeta, TestClass);

    assertEquals(getControllerOwnMeta(TestClass), testMeta);
  },
});

Deno.test({
  name: "setControllerMeta should assign metadata to target constructor",
  fn() {
    const testMeta: ControllerMetadata = ("TEST" as unknown) as ControllerMetadata;

    class TestClass {
      public testMethod() {
        setControllerMeta(this, testMeta);
      }
    }
    new TestClass().testMethod();
    assertEquals(Reflect.getMetadata(CONTROLLER_META_PROPKEY, TestClass), testMeta);
  },
});

Deno.test({
  name: "getControllerMeta should retreive metadata from target constructor",
  fn() {
    const testMeta: ControllerMetadata = ("TEST" as unknown) as ControllerMetadata;

    class TestClass {
      public testMethod() {
        assertEquals(getControllerMeta(this), testMeta);
      }
    }

    Reflect.defineMetadata(CONTROLLER_META_PROPKEY, testMeta, TestClass);

    new TestClass().testMethod();
  },
});
