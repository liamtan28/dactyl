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
import { ApplicationConfig, EInjectionScope } from "./types.ts";
import DIContainer from "./dependency_container.ts";
import { getInjectableMetadata } from "./metadata.ts";

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

    for (const newable of appConfig.injectables) {
      const scope: EInjectionScope = getInjectableMetadata(newable);
      DIContainer.register(newable, scope, newable.name);
    }
    DIContainer.instantiateAllSingletons();

    this.#router = new Router();
    this.#app = new OakApplication();

    for (const controller of appConfig.controllers) {
      this.#router.register(controller);
    }

    if (cors) this.#app.use(this.cors);
    if (timing) this.#app.use(this.timing);
    if (log) this.#app.use(this.logger);

    // apply routes
    this.#app.use(this.#router.middleware());
    // if routes passes through, handle not found with 404 response.
    this.#app.use(this.handleNotFound);
  }
  /**
   * Timing middleware, will be enabled in constructor if `appConfig.timing`
   * is `true`
   */
  private async timing(context: Context, next: Function): Promise<void> {
    const start: number = Date.now();
    await next();
    const ms: number = Date.now() - start;
    context.response.headers.set("X-Response-Time", `${ms}ms`);
  }
  /**
   * Logger middleware, will be enabled in constructor if `appConfig.log`
   * is `true`
   */
  private async logger(context: Context, next: Function): Promise<void> {
    const method: string = context.request.method;
    const urlRaw: URL = context.request.url;
    const date: string = new Date().toTimeString();
    await next();
    const status: Status = context.response.status ?? Status.OK;
    let colorFn: Function = green;
    const statusPrefix: string = status.toString()[0];
    if (statusPrefix === "3") colorFn = yellow;
    else if (statusPrefix === "4" || statusPrefix === "5") colorFn = red;

    console.info(
      `${date} [${method.toUpperCase()}] - ${urlRaw.pathname} - ${colorFn(
        `[${status} ${STATUS_TEXT.get(status)}]`
      )}`
    );
  }
  /**
   * CORS middleware, will be enabled in constructor if `appConfig.cors`
   * is `true`
   */
  private async cors(context: Context, next: Function): Promise<void> {
    context.response.headers.set(
      "Access-Control-Allow-Origin",
      context.request.headers.get("Origin") || "*"
    );
    context.response.headers.set(
      "Access-Control-Allow-Methods",
      context.request.headers.get("Access-Control-Request-Method") || "*"
    );
    context.response.headers.set(
      "Access-Control-Allow-Headers",
      context.request.headers.get("Access-Control-Request-Headers") || "*"
    );

    await next();
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
    this.#app.listen({ port });
  }
}
