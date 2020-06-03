// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Get } from "./Method.ts";
import { ControllerCallback } from "./types.ts";
import { assertEquals } from "./deps.ts";
import { Router } from "./Router.ts";
import { Controller } from "./Controller.ts";

function makeMockRequest(endpoint: string): any {
    return {
        request: {
            url: new URL(`http://localhost:8000/${endpoint}`),
            headers: new Map(),
        },
        params: {},
        body: {},
        response: {} // changes appear here
    };
}

Deno.test({
    name: "Router should register GET action correctly",
    async fn(): Promise<void> {
        
        const router: Router = new Router();
        const methodName: string = "testAction";
        const testDataKey: string = "testDataKey";
        @Controller('/test')
        class TestController {
            @Get('/')
            public [methodName]() {
                return {
                    data: "testDataKey",
                }
            }
        }

        const fnMapping: Map<string, ControllerCallback> = router.register(TestController);
        const cb: ControllerCallback | undefined = fnMapping.get(methodName);
        const mockContext: any = makeMockRequest('/test');
        await (cb as ControllerCallback)(mockContext);
        assertEquals(mockContext.response?.body?.data, testDataKey);
    }
});
Deno.test({
    name: "Router should register GET action correctly",
    async fn(): Promise<void> {
        
        const router: Router = new Router();
        const methodName: string = "testAction";
        const testDataKey: string = "testDataKey";
        @Controller('/test')
        class TestController {
            @Get('/')
            public [methodName]() {
                return {
                    data: "testDataKey",
                }
            }
        }

        const fnMapping: Map<string, ControllerCallback> = router.register(TestController);
        const cb: ControllerCallback | undefined = fnMapping.get(methodName);
        const mockContext: any = makeMockRequest('/test');
        await (cb as ControllerCallback)(mockContext);
        assertEquals(mockContext.response?.body?.data, testDataKey);
    }
});
