import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { defineParameterDecorator } from "./Arg.ts";
import { Get } from "./Method.ts";
import { getControllerOwnMeta } from "./metadata.ts";
import { ControllerMetadata, RouteArgument, ArgsType } from "./types.ts";


const TEST_ARG_TYPE: ArgsType = ArgsType.PARAM;
const TestDecorator = (key: string) => defineParameterDecorator(TEST_ARG_TYPE, key);

/**
 * @Param tests
 */
Deno.test({
  name: "Arg decorator appropriately applies default metadata if class is Newable non-controller",
  fn(): void {
    class TestClass {
        @Get()
        public testAction(@TestDecorator('id') id: any): void {}
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

    }
});
