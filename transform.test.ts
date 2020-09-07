// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { assertEquals, Context, RouterContext, spy, Spy } from "./deps.ts";
import {
  retrieveFromContext,
  buildRouteArgumentsFromMeta,
  executeBeforeFns,
  getStatus,
} from "./transform.ts";
import { createMockContext, MockContextOptions } from "./utils.ts";
import {
  RouteArgument,
  RouteDefinition,
  HttpMethod,
  RequestLifetime,
  ArgsType,
  EInjectionScope,
} from "./types.ts";
import DIContainer from "./dependency_container.ts";
import { Injectable } from "./injection.ts";

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

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve query parameters from context",
  async fn() {
    const testKey: string = "foo";
    const testValue: string = "bar";
    const testMethodName: string = "testMethodName";

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Query('foo') foo: string): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.QUERY,
        index: 0,
        key: testKey,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({ path: `/?${testKey}=${testValue}` });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();

    assertEquals(resolved[0], testValue);
  },
});

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve parameters from context",
  async fn() {
    const testKey: string = "foo";
    const testValue: string = "bar";
    const testMethodName: string = "testMethodName";

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Param('foo') foo: string): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.PARAM,
        index: 0,
        key: testKey,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({
      path: "/",
      params: {
        [testKey]: testValue,
      },
    });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();
    assertEquals(resolved[0], testValue);
  },
});

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve headers from context",
  async fn() {
    const testMethodName: string = "testMethodName";

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Header() headers: string): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.HEADER,
        index: 0,
        key: undefined,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({
      path: "/",
    });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();
    assertEquals(resolved[0], {});
  },
});

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve whole context object",
  async fn() {
    const testMethodName: string = "testMethodName";

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Context() ctx: RouterContext): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.CONTEXT,
        index: 0,
        key: undefined,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({
      path: "/",
    });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();
    assertEquals(resolved[0].request !== null, true);
  },
});

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve whole request object",
  async fn() {
    const testMethodName: string = "testMethodName";

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Request() req: Request): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.REQUEST,
        index: 0,
        key: undefined,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({
      path: "/",
    });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();

    assertEquals(resolved[0].url instanceof URL, true);
  },
});

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve whole response object",
  async fn() {
    const testMethodName: string = "testMethodName";

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Response() res: Response): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.RESPONSE,
        index: 0,
        key: undefined,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({
      path: "/",
    });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();

    assertEquals(Object.keys(resolved[0]).length, 4);
  },
});

Deno.test({
  name: "buildRouteArgumentsFromMeta should retrieve injected dependencies by key",
  async fn() {
    @Injectable(EInjectionScope.SINGLETON)
    class TestDependency {}
    const testKey: string = "foo";
    const testMethodName: string = "testMethodName";

    DIContainer.register(TestDependency, EInjectionScope.SINGLETON, testKey);

    // Mock built metadata, this would usually come from decorator
    // Equivilant to:
    /*
      testMethodName(@Inject('foo') foo: TestDependency): any {}
    */
    const args: Array<RouteArgument> = [
      {
        type: ArgsType.INJECT,
        index: 0,
        key: testKey,
        argFor: testMethodName,
      },
    ];
    /**
     * Mocked execution action, assigns get simulated get request
     * to with context containing query parameter
     */
    const route: RouteDefinition = {
      path: "/",
      requestMethod: HttpMethod.GET,
      methodName: testMethodName,
    };
    const context: Context = createMockContext({
      path: "/",
    });
    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const resolved: Array<any> = await buildRouteArgumentsFromMeta(
      args,
      route,
      <RouterContext>context,
      lifetime
    );
    lifetime.end();

    assertEquals(resolved[0] instanceof TestDependency, true);
  },
});
