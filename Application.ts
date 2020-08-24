// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import {
  Application as OakApplication,
  Response,
  Status,
  STATUS_TEXT,
  Context,
  red,
  yellow,
  green,
  blue,
  bgBlue,
} from "./deps.ts";

import { Router } from "./Router.ts";
import { ApplicationConfig, EInjectionScope, ControllerMetadata } from "./types.ts";
import DIContainer from "./dependency_container.ts";
import { getInjectableMetadata, getControllerOwnMeta } from "./metadata.ts";

import { logger, cors as corsMiddleware, timing as timingMiddleware } from "./middleware.ts";

/**
 * Bootstrap class responsible for registering controllers
 * onto Router, and starting the Oak webserver
 */
export class Application {
  #router: Router;
  #app: OakApplication;

  public constructor(appConfig: ApplicationConfig) {
    const config: ApplicationConfig["config"] = appConfig.config ?? {};
    const { log = true, timing = true, cors = true }: any = config;

    // register injectables and controllers into `DIContainer` singleton
    for (const newable of appConfig.injectables) {
      const scope: EInjectionScope = getInjectableMetadata(newable);
      DIContainer.register(newable, scope, newable.name);
    }
    for (const controller of appConfig.controllers) {
      const meta: ControllerMetadata | undefined = getControllerOwnMeta(controller);
      if (!meta) {
        throw new Error("Attempted to register non-controller class");
      }
      DIContainer.register(controller, meta.scope, controller.name);
    }

    this.#router = new Router();
    this.#app = new OakApplication();

    for (const controller of appConfig.controllers) {
      this.#router.register(controller);
    }

    if (cors) this.#app.use(corsMiddleware);
    if (timing) this.#app.use(timingMiddleware);
    if (log) this.#app.use(logger);

    // apply routes
    this.#app.use(this.#router.middleware());
    // if routes passes through, handle not found with 404 response.
    this.#app.use(this.handleNotFound);
  }

  /**
   * 404 middleware, enabled by default and not disableable
   */
  private async handleNotFound(context: Context): Promise<void> {
    const response: Response = context.response;

    response.status = 404;
    response.body = {
      error: "Not Found",
      status: 404,
    };
  }
  /**
   * Function responsible for begin listen of oak webserver.
   * Console notified when webserver begins.
   *
   * The webserver will start on port `port` as provided as
   * an argument.
   */
  public async run(port: number): Promise<void> {
    const bootstrapMsg: string = this.#router.getBootstrapMsg();
    console.log(blue(bootstrapMsg));
    console.info(bgBlue(`Dactyl running - please visit http://localhost:${port}/`));
    DIContainer.instantiateAllSingletons();
    this.#app.listen({ port });
  }
}
