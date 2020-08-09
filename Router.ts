// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Router as OakRouter, Middleware } from "./deps.ts";
import { RouteDefinition, ControllerMetadata, Newable, ExecutionResult } from "./types.ts";

import { ExecutionContainer } from "./execution_container.ts";

import { RouterContext } from "./deps.ts";
import { getControllerOwnMeta } from "./metadata.ts";

/**
 * Router subclass - abstraction on top of `Router` class from Oak.
 *
 * exposes methods `Router.register()` and `router.middleware()` to
 * `Application` class for bootstrapping Oak application
 */
export class Router extends OakRouter {
  #LOGO_ASCII = `\
______           _         _ 
|  _  \\         | |       | |
| | | |__ _  ___| |_ _   _| |
| | | / _\` |/ __| __| | | | |
| |/ / (_| | (__| |_| |_| | |
|___/ \\__,_|\\___|\\__|\\__, |_| FRAMEWORK
                      __/ |  
                      |___/   
  `;
  #bootstrapMsg: string;

  public constructor() {
    super();
    this.#bootstrapMsg = this.#LOGO_ASCII + "\n";
  }
  /**
   * Register function consumed by `Application`, takes controller
   * class definition and strips it's metadata. From this metadata,
   * the `register` function appropriately configures `super()` oak
   * router. An instance of the provided controller class definition
   * is created, and the controller's actions are mapped to routes,
   * E.g.
   *
   * ```ts
   * import { DinosaurController } from "./example/DinosaurController.ts";
   *
   * const router: Router = new Router();
   * router.register(DinosaurController);
   * // router superclass now configured to use DinosaurController's actions
   * ```
   */
  register(controller: Newable<any>): void {
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(controller);

    if (!meta || !meta.prefix) {
      throw new Error("Attempted to register non-controller class to DactylRouter");
    }

    this.#appendToBootstrapMsg(`${meta.prefix}\n`);

    meta.routes.forEach((route: RouteDefinition): void => {
      this.#appendToBootstrapMsg(`  [${route.requestMethod.toUpperCase()}] ${route.path}\n`);
      const path: string = this.#normalizedPath(meta.prefix as string, route.path);

      // Bind execution container to path in Oak
      (this[route.requestMethod] as Function)(
        path,
        async (context: RouterContext): Promise<void> => {
          const container: ExecutionContainer<any> = new ExecutionContainer<any>(
            controller,
            route,
            context
          );
          const result: ExecutionResult = await container.execute();

          context.response.body = result.body;
          context.response.status = result.status;
        }
      );
    });
    this.#appendToBootstrapMsg("");
  }
  /**
   * Helper method that combines controller prefix with route path.
   *
   * If the path terminates in `/`, slice it.
   */
  #normalizedPath = (prefix: string, path: string) => {
    let normalizedPath: string = prefix + path;
    if (normalizedPath.slice(-1) === "/") {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    return normalizedPath;
  };
  /**
   * middleware getter for the internal router. To be used in `Application` bootstrap
   * where appropriate, E.g.
   *
   * ```ts
   * // From Oak
   * const app: Application = new Application();
   * // From Dactyl
   * const router: Router = new Router();
   * // ... register controllers ...
   * app.use(router.middleware());
   * // routes now mapped to oak
   * ```
   */
  middleware(): Middleware {
    return this.routes();
  }
  /**
   * Returns message to be displayed when application starts
   */
  getBootstrapMsg(): string {
    return this.#bootstrapMsg;
  }
  /**
   * Helper that updates the internal bootstrap message. Used on application start
   * to display on screen success.
   */
  #appendToBootstrapMsg = (msg: string): string => {
    this.#bootstrapMsg += msg;
    return this.#bootstrapMsg;
  };
}
