// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals } from "./deps.ts";

import {
  CONTROLLER_META_PROPKEY,
  getControllerOwnMeta,
  getControllerMeta,
  setControllerOwnMeta,
  setControllerMeta,
} from "./metadata.ts";
import { ControllerMetadata } from "./types.ts";

Deno.test({
  name:
    "setControllerOwnMeta should assign metadata to the controller meta key",
  fn(): void {
    class TestClass {
    }
    const testMeta: ControllerMetadata = "TEST" as unknown as ControllerMetadata;

    setControllerOwnMeta(TestClass, testMeta);
    assertEquals(Reflect.get(TestClass, CONTROLLER_META_PROPKEY), testMeta);
  },
});

Deno.test({
  name:
    "getControllerOwnMeta should retreive metadata from controller meta key",
  fn(): void {
    class TestClass {
    }
    const testMeta: ControllerMetadata = "TEST" as unknown as ControllerMetadata;

    Reflect.defineProperty(TestClass, CONTROLLER_META_PROPKEY, {
      value: testMeta,
    });

    assertEquals(getControllerOwnMeta(TestClass), testMeta);
  },
});

Deno.test({
    name: "setControllerMeta should assign metadata to target constructor",
    fn() {
        const testMeta: ControllerMetadata = "TEST" as unknown as ControllerMetadata;
  
        class TestClass {
            public testMethod() {
                setControllerMeta(this, testMeta);
            }
        }
        new TestClass().testMethod();
        assertEquals(Reflect.get(TestClass, CONTROLLER_META_PROPKEY), testMeta);
    }
});

Deno.test({
    name: "getControllerMeta should retreive metadata from target constructor",
    fn() {
        const testMeta: ControllerMetadata = "TEST" as unknown as ControllerMetadata;

        class TestClass {
            public testMethod() {
                assertEquals(getControllerMeta(this), testMeta);
            }
        }
   
        Reflect.defineProperty(TestClass, CONTROLLER_META_PROPKEY, {
            value: testMeta,
        });

        new TestClass().testMethod();
       
    }
});
