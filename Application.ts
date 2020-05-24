import { Application as OakApplication } from "./deps.ts";
import { DactylRouter } from "./DactylRouter.ts";
import { ApplicationConfig } from "./model.ts";
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
  }

  public async run(port: number) {
    this.app.listen({ port });
  }
}
