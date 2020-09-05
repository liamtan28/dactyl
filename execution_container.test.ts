import { assertEquals, Context, RouterContext } from "./deps.ts";
import { ExecutionContainer } from "./execution_container.ts";
import {
  ControllerMetadata,
  EInjectionScope,
  RouteDefinition,
  RouteArgument,
  HttpMethod,
  ExecutionResult,
} from "./types.ts";
import { Controller } from "./controller.ts";
import { getControllerOwnMeta } from "./metadata.ts";
import { Get } from "./method.ts";
import { createMockContext } from "./utils.ts";
import DIContainer from "./dependency_container.ts";

Deno.test({
  name: "expect execution container result to match the body of the called action",
  async fn() {
    const responseBody = { key: "value" };

    @Controller("/test", EInjectionScope.SINGLETON)
    class TestController {
      @Get("/")
      testAction() {
        return responseBody;
      }
    }

    DIContainer.register(TestController, EInjectionScope.SINGLETON, TestController.name);

    const meta: ControllerMetadata | undefined = getControllerOwnMeta(TestController);
    const container: ExecutionContainer = new ExecutionContainer(
      <ControllerMetadata>meta,
      TestController.name
    );
    const route: RouteDefinition = {
      requestMethod: HttpMethod.GET,
      path: "/",
      methodName: "testAction",
    };

    const context: Context = createMockContext({ path: "/test" });

    const { body }: ExecutionResult = await container.execute(route, <RouterContext>context);

    assertEquals(body, responseBody);
  },
});
