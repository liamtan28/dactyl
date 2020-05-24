// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Router as OakRouter, Middleware } from "./deps.ts";

import {
  RouteDefinition,
  HttpMethod,
  ArgsType,
  ControllerMetadata,
  RouteArgument,
} from "./types.ts";

import { HttpException } from "./HttpException.ts";
import { RouterContext, Status, STATUS_TEXT } from "./deps.ts";
import { getControllerMeta } from "./metadata.ts";

/**
 * Router subclass - abstraction on top of `Router` class from Oak.
 *
 * exposes methods `Router.register()` and `router.middleware()` to
 * `Application` class for bootstrapping Oak application
 */
export class Router extends OakRouter {
  public constructor() {
    super();
    console.info(`\
______           _         _ 
|  _  \\         | |       | |
| | | |__ _  ___| |_ _   _| |
| | | / _\` |/ __| __| | | | |
| |/ / (_| | (__| |_| |_| | |
|___/ \\__,_|\\___|\\__|\\__, |_| FRAMEWORK
                      __/ |  
                      |___/   
    `);
    console.info("Registered routes:\n");
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
  public register(controller: any): void {
    const instance: any = new controller();

    const meta: ControllerMetadata = getControllerMeta(controller);
    if (!meta || !meta.prefix) {
      throw new Error("Attempted to register non-controller class to DactylRouter");
    }
    console.info(`\t${meta.prefix}`);

    meta.routes.forEach((route: RouteDefinition): void => {
      console.info(`\t\t[${route.requestMethod.toUpperCase()}] ${route.path}`);

      // normalize path if required
      let path: string = meta.prefix + route.path;
      if (path.slice(-1) === "/") {
        path = path.slice(0, -1);
      }

      // Call routing function on OakRouter superclass
      this[route.requestMethod](
        path,
        async (context: RouterContext): Promise<void> => {
          try {
            const { params, headers, query, body } = await this.retrieveFromContext(context);

            const routeArgs: any[] = this.buildRouteArgumentsFromMeta(
              meta.args,
              route.methodName as string,
              params,
              body,
              query,
              headers,
              context
            );

            // call controller action here. Provide arguments injected via parameter
            // decorator function metadata
            const response: any = await instance[route.methodName as string](...routeArgs);

            // controller action manually accesses context.request.body and returns nothing
            // so return early
            if (!response && context.response.body) return;
            // controller action returned no data, and didn't attach anything to response
            // body. Assume 204 no content.
            else if (!response && !context.response.body) {
              return this.sendNoData(context.response);
            }

            const statusCode: number =
              meta.defaultResponseCodes.get(route.methodName) ||
              (route.requestMethod == HttpMethod.POST ? 201 : 200);

            // Assign body and status here before oak middleware moves to next
            context.response.body = response;
            context.response.status = statusCode;
          } catch (error) {
            // Handle known error here
            if (error instanceof HttpException) {
              const response: {
                error: string | undefined;
                status: Status;
              } = error.getError();
              context.response.status = response.status;
              context.response.body = response;
            } else {
              this.handleUnknownException(error, context.response);
            }
          }
        }
      );
    });
  }
  /**
   * Helper function for deconstructing Oaks `RouterContext` context
   * object. Retreives `context.params`, `context.request.headers`,
   * `context.request.url.searchParams`, and `context.request.body()`
   * and maps them appropriately
   */
  private async retrieveFromContext(
    context: RouterContext
  ): Promise<{
    params: any;
    headers: any;
    query: any;
    body: any;
  }> {
    const url: URL = context.request.url;
    const headersRaw: Headers = context.request.headers;

    const params: any = context.params;

    const headers: any = {};
    for (const [key, value] of headersRaw.entries()) {
      headers[key] = value;
    }

    const query: any = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    let body: any = {};
    if (context.request.hasBody) body = await context.request.body();

    return { params, headers, query, body };
  }

  /**
   * Helper method for constructing controller action arguments
   * from metadata on the controller.
   */
  private buildRouteArgumentsFromMeta(
    args: RouteArgument[],
    methodName: string,
    params: any,
    body: any,
    query: any,
    headers: any,
    context: RouterContext
  ): any[] {
    // Filter controller metadata to only include arg definitions
    // for this action
    const filteredArguments: RouteArgument[] = args.filter(
      (arg: RouteArgument): boolean => arg.argFor === methodName
    );

    // Metadata is assigned in a non-deterministic order, so
    // ensure order by sorting on index.
    filteredArguments.sort((a: RouteArgument, b: RouteArgument): number => a.index - b.index);

    // Determined by the type of parameter decorator used, map the
    // arguments metadata onto the appropriate data source
    return filteredArguments.map((arg: RouteArgument): any => {
      switch (arg.type) {
        case ArgsType.PARAM:
          return params[arg.key];
        case ArgsType.BODY:
          return body.value[arg.key];
        case ArgsType.QUERY:
          return query[arg.key];
        case ArgsType.HEADER:
          return headers[arg.key];
        case ArgsType.CONTEXT:
          return context;
        case ArgsType.REQUEST:
          return context.request;
        case ArgsType.RESPONSE:
          return context.response;
        default:
          throw null;
      }
    });
  }
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
  public middleware(): Middleware {
    return this.routes();
  }
  /**
   * Helper method called when controller action returns no json, and
   * `RouterContext` `context.response.body` contains no body
   */
  private sendNoData(res: any): void {
    // Send 204 No Content.
    res.status = Status.NoContent;
  }
  /**
   * Helper method for handling non-standard exceptions raised at runtime.
   * This could be caused by an unhandled promise rejection, or a custom error
   * thrown either internally or from an external module.
   *
   * Dactyl will send a 500 error to the end user.
   */
  private handleUnknownException(error: any, res: any): void {
    console.error(error);
    res.status = Status.InternalServerError;
    res.body = {
      error: STATUS_TEXT.get(Status.InternalServerError),
      status: Status.InternalServerError,
    };
  }
}
