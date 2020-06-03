// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Get, Post } from "./Method.ts";
import { ControllerCallback } from "./types.ts";
import { assertEquals } from "./deps.ts";
import { Router } from "./Router.ts";
import { Controller } from "./Controller.ts";
import { HttpStatus } from "./HttpStatus.ts";

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
    name: "Router should return data specified in controller action",
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
    name: "Router should set default status code appropriately",
    async fn(): Promise<void> {
        const router: Router = new Router();
        const methodName: string = "testAction";
        const testStatus: number = 301;
        @Controller('/test')
        class TestController {
            @Get('/')
            @HttpStatus(testStatus)
            public [methodName]() {
                return {}
            }
        }

        const fnMapping: Map<string, ControllerCallback> = router.register(TestController);
        const cb: ControllerCallback | undefined = fnMapping.get(methodName);
        const mockContext: any = makeMockRequest('/test');
        await (cb as ControllerCallback)(mockContext);
        assertEquals(mockContext.response?.status, testStatus);
    }
});

Deno.test({
    name: "Router should return default 200 status if not post request, and no HttpStatus defined",
    async fn(): Promise<void> {
        const router: Router = new Router();
        const methodName: string = "testAction";
        const expectedStatus: number = 200;
        @Controller('/test')
        class TestController {
            @Get('/')
            public [methodName]() {
                return {}
            }
        }

        const fnMapping: Map<string, ControllerCallback> = router.register(TestController);
        const cb: ControllerCallback | undefined = fnMapping.get(methodName);
        const mockContext: any = makeMockRequest('/test');
        await (cb as ControllerCallback)(mockContext);
        assertEquals(mockContext.response?.status, expectedStatus);
    }
});

Deno.test({
    name: "Router should return default 201 status if post request, and no HttpStatus defined",
    async fn(): Promise<void> {
        const router: Router = new Router();
        const methodName: string = "testAction";
        const expectedStatus: number = 201;
        @Controller('/test')
        class TestController {
            @Post('/')
            public [methodName]() {
                return {}
            }
        }

        const fnMapping: Map<string, ControllerCallback> = router.register(TestController);
        const cb: ControllerCallback | undefined = fnMapping.get(methodName);
        const mockContext: any = makeMockRequest('/test');
        await (cb as ControllerCallback)(mockContext);
        assertEquals(mockContext.response?.status, expectedStatus);
    }
});