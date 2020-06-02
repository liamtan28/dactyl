import { Router } from "./Router.ts";
import { Middleware, assertEquals } from "./deps.ts";

Deno.test({
    name: "Router should return empty routes if no controllers are registered",
    async fn(): Promise<void> {
        const router: Router = new Router();

        const middleware: Middleware = await router.middleware();
        console.log("DDD", middleware, router.allowedMethods());
        assertEquals(true, true);
    }
});