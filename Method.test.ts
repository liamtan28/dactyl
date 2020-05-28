// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals } from "./deps.ts";

import { defineRouteDecorator } from "./Method.ts";
import { HttpMethod, ControllerMetadata, RouteDefinition } from "./types.ts";
import { getControllerOwnMeta } from "./metadata.ts";

const prefix: string = "/";
const testMethod: HttpMethod = HttpMethod.GET;
const TestDecorator = (prefix: string): MethodDecorator => defineRouteDecorator(prefix, testMethod);

Deno.test({
    name: "Method decorator should assign default metadata to Newable non-controller class",
    fn(): void {
        class TestClass {
            @TestDecorator(prefix)
            public testAction(): void {}
        }
    
        const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
        assertEquals(meta?.prefix, null);
        assertEquals(meta?.defaultResponseCodes instanceof Map, true);
        assertEquals(meta?.routes instanceof Map, true);
        assertEquals(meta?.args instanceof Array, true);
    }
});

Deno.test({
    name: "Method decorator should assign route metadata to controller class",
    fn(): void {
        const actionName: string = "testAction";
        class TestClass {
            @TestDecorator(prefix)
            public [actionName](): void {}
        }
    
        const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestClass);
        const route: RouteDefinition | undefined = meta?.routes.get(actionName);
        assertEquals(route?.methodName, actionName);
        assertEquals(route?.path, prefix);
        assertEquals(route?.requestMethod, testMethod);
    }
});
