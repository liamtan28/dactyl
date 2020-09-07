import { assertEquals } from "./deps.ts";
import { Application } from "./application.ts";

import { superoak } from "https://deno.land/x/superoak@2.1.0/mod.ts";

Deno.test({
  name: "useLogger should be chainable",
  fn() {
    const app: Application = new Application({
      controllers: [],
      injectables: [],
    });
    const shouldBeApplication: any = app.useLogger();
    assertEquals(app, shouldBeApplication);
  },
});

Deno.test({
  name: "useTiming should be chainable",
  fn() {
    const app: Application = new Application({
      controllers: [],
      injectables: [],
    });
    const shouldBeApplication: any = app.useTiming();
    assertEquals(app, shouldBeApplication);
  },
});

Deno.test({
  name: "useCors should be chainable",
  fn() {
    const app: Application = new Application({
      controllers: [],
      injectables: [],
    });
    const shouldBeApplication: any = app.useCors();
    assertEquals(app, shouldBeApplication);
  },
});
