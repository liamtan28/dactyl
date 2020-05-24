import {
  Application as OakApplication,
  RouterContext,
  Response,
} from "./deps.ts";
import { DactylRouter } from "./DactylRouter.ts";
import { ApplicationConfig } from "./types.ts";

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
    this.app.use((context: any) => this.notFoundHandler(context));
  }

  public notFoundHandler(context: RouterContext): void {
    const response: Response = context.response;
    response.status = 404;
    response.body = {
      error: "Not Found",
      status: 404,
    };
  }

  public async run(port: number) {
    console.info(
      `Dactyl bootstrapped - please visit http://localhost:${port}/`
    );
    this.app.listen({ port });
  }
}
