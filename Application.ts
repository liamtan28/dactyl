// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Application as OakApplication, Response, Status, STATUS_TEXT } from "./deps.ts";

import { Router } from "./Router.ts";
import { ApplicationConfig } from "./types.ts";

/**
 * Bootstrap class responsible for registering controllers
 * onto Router, and starting the Oak webserver
 */
export class Application {
  appConfig: ApplicationConfig;
  private router: Router;
  private app: OakApplication;

  public constructor(appConfig: ApplicationConfig) {
    this.router = new Router();
    this.app = new OakApplication();
    this.appConfig = appConfig;

    for (const controller of appConfig.controllers) {
      this.router.register(controller);
    }

    // configure timing console feedback here
    this.app.use(
      async (context: any, next: Function): Promise<void> => {
        const start: number = Date.now();
        await next();
        const ms: number = Date.now() - start;
        context.response.headers.set("X-Response-Time", `${ms}ms`);
      }
    );
    // log middleware
    this.app.use(
      async (context: any, next: Function): Promise<void> => {
        const method: string = context.request.method;
        const urlRaw: URL = context.request.url;
        const date: string = new Date().toTimeString();

        await next();
        const status: Status = context.response.status;
        console.info(
          `${date} [${method.toUpperCase()}] - ${urlRaw.pathname} - [${status} ${STATUS_TEXT.get(
            status
          )}]`
        );
      }
    );

    // apply routes
    this.app.use(this.router.middleware());

    // 404 handler
    this.app.use((context: any): void => {
      const response: Response = context.response;

      response.status = 404;
      response.body = {
        error: "Not Found",
        status: 404,
      };
    });
  }

  public getAppConfig(): ApplicationConfig {
    return this.appConfig;
  }
  /**
   * Function responsible for begin listen of oak webserver.
   * Console notified when webserver begins.
   *
   * The webserver will start on port `port` as provided as
   * an argument.
   */
  public async run(port: number): Promise<void> {
    console.info(`Dactyl running - please visit http://localhost:${port}/\n\n[LOGS]`);
    this.app.listen({ port });
  }
}
