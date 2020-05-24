// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Application as OakApplication, Response } from "./deps.ts";

import { DactylRouter } from "./DactylRouter.ts";
import { ApplicationConfig } from "./types.ts";

/**
 * Bootstrap class responsible for registering controllers
 * onto Router, and starting the Oak webserver
 */
export class Application {
  private router: DactylRouter;
  private app: OakApplication;

  public constructor(appConfig: ApplicationConfig) {
    this.router = new DactylRouter();
    this.app = new OakApplication();

    for (const controller of appConfig.controllers) {
      this.router.register(controller);
    }

    this.app.use(this.router.middleware());

    this.app.use((context: any): void => {
      const response: Response = context.response;

      response.status = 404;
      response.body = {
        error: "Not Found",
        status: 404,
      };
    });
  }
  /**
   * Function responsible for begin listen of oak webserver.
   * Console notified when webserver begins.
   *
   * The webserver will start on port `port` as provided as
   * an argument.
   */
  public async run(port: number): Promise<void> {
    console.info(`Dactyl running - please visit http://localhost:${port}/`);
    this.app.listen({ port });
  }
}
