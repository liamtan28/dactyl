// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import {
  Application as OakApplication,
  RouterContext,
  Response,
} from "./deps.ts";

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
   * Execute the Oak webserver here. Port is a required field.
   * Console will be notified when server begins
   */
  public async run(port: number) {
    console.info(
      `Dactyl bootstrapped - please visit http://localhost:${port}/`
    );
    this.app.listen({ port });
  }
}
