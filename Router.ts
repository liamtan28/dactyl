// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Router as OakRouter, Middleware } from "./deps.ts";
import {
  RouteDefinition,
  HttpMethod,
  ArgsType,
  ControllerMetadata,
  RouteArgument,
  Newable,
  ControllerCallback,
} from "./types.ts";

import {
  HttpException,
  InternalServerErrorException,
} from "./HttpException.ts";
import { RouterContext, Status } from "./deps.ts";
import { getControllerOwnMeta } from "./metadata.ts";

/**
 * Router subclass - abstraction on top of `Router` class from Oak.
 *
 * exposes methods `Router.register()` and `router.middleware()` to
 * `Application` class for bootstrapping Oak application
 */
export class Router extends OakRouter {
  private static LOGO_ASCII = `\
______           _         _ 
|  _  \\         | |       | |
| | | |__ _  ___| |_ _   _| |
| | | / _\` |/ __| __| | | | |
| |/ / (_| | (__| |_| |_| | |
|___/ \\__,_|\\___|\\__|\\__, |_| FRAMEWORK
                      __/ |  
                      |___/   
  `;
  private bootstrapMsg: string;

  public constructor() {
    super();
    this.bootstrapMsg = Router.LOGO_ASCII + "\n";
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
   * 
   * returns `Map<string, ControllerCallback>` containing all routes and 
   * callbacks mapped onto the oak router when `register` was called.
   * Mainly used for testing.
   */
  public register(controller: Newable<any>): Map<string, ControllerCallback> {
    const fnMapping: Map<string, ControllerCallback> = new Map<
      string,
      ControllerCallback
    >();
    const instance: any = new controller();
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(
      controller,
    );

    if (!meta || !meta.prefix) {
      throw new Error(
        "Attempted to register non-controller class to DactylRouter",
      );
    }

    this.appendToBootstrapMsg(`${meta.prefix}\n`);

    meta.routes.forEach((route: RouteDefinition): void => {
      this.appendToBootstrapMsg(
        `  [${route.requestMethod.toUpperCase()}] ${route.path}\n`,
      );
      // define callback here
      const controllerCb: ControllerCallback = async (
        context: RouterContext,
      ): Promise<void> => {
        // Retrieve data from context
        const { params, headers, query, body } = await this.retrieveFromContext(
          context,
        );
        // Using the controller metadata and data from context, build controller args
        const routeArgs: Array<any> = this.buildRouteArgumentsFromMeta(
          meta.args,
          route.methodName as string,
          params,
          body,
          query,
          headers,
          context,
        );

        // execute any defined before actions. If any fails, this will
        // return true. If it does return true, context response as
        // been set so return early and skip controller action
        const beforeFailed: boolean = await this.executeBeforeFns(
          meta.beforeFns.get(route.methodName as string) ?? [],
          body,
          params,
          query,
          headers,
          context,
        );
        if (beforeFailed) return;

        // execute controller action and return appropriate responseBody and status
        const [responseBody, responseStatus] = await this
          .executeControllerAction(instance, route, routeArgs, meta, context);

        context.response.body = responseBody;
        context.response.status = responseStatus;
      };

      // Call routing function on OakRouter superclass
      (this[route.requestMethod] as Function)(
        this.normalizedPath(meta.prefix as string, route.path),
        controllerCb,
      );
      fnMapping.set(route.methodName as string, controllerCb);
    });
    this.appendToBootstrapMsg("");
    return fnMapping;
  }
  /**
   * Helper function that executes before actions set by decorators.
   * Async as function may be async. Supplies arguments to fn being
   * executed to allow validation on body/params/headers to occur
   */
  private async executeBeforeFns(
    beforeFns: Array<Function>,
    body: any,
    params: any,
    query: any,
    headers: Headers,
    context: RouterContext,
  ): Promise<boolean> {
    try {
      for (const fn of beforeFns) {
        await fn(body.value, params, query, headers, context);
      }
      return false;
    } catch (error) {
      const [errorStatus, errorBody] = this.handleError(error);
      context.response.status = errorStatus;
      context.response.body = errorBody;
      return true;
    }
  }
  /**
   * Helper function that executes controller action, once finished this
   * determines the correct status and response body from 
   * what was returned from the controller action,
   * and the `RouterContext`
   */
  private async executeControllerAction(
    instance: any,
    route: RouteDefinition,
    args: Array<any>,
    meta: ControllerMetadata,
    context: RouterContext,
  ): Promise<Array<number | any>> {
    let status: number = 200;
    let body: any = {};
    try {
      const controllerResponse: any =
        await instance[route.methodName as string](...args);
      if (!controllerResponse && context.response.body) {
        status = context.response.status ?? this.getStatus(meta, route);
        body = context.response.body;
      } else if (!controllerResponse && !context.response.body) {
        status = 204;
        body = null;
      } else {
        status = this.getStatus(meta, route);
        body = controllerResponse;
      }
    } catch (error) {
      const [errorStatus, errorBody] = this.handleError(error);
      status = errorStatus;
      body = errorBody;
    } finally {
      return [body, status];
    }
  }
  /**
   * Helper function that returns the appropriate error status and body
   * based on the error supplied. If its an `HttpException`, this
   * will be raised, otherwise it will default to `500`
   */
  private handleError(error: any) {
    if (!(error instanceof HttpException)) {
      console.error(error);
      error = new InternalServerErrorException();
    }
    return [error.getError().status, error.getError()];
  }
  /**
   * Helper function for deconstructing Oaks `RouterContext` context
   * object. Retreives `context.params`, `context.request.headers`,
   * `context.request.url.searchParams`, and `context.request.body()`
   * and maps them appropriately
   */
  private async retrieveFromContext(
    context: RouterContext,
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
    if (context.request.hasBody) body.value = await context.request.body().value;
    
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
    context: RouterContext,
  ): Array<any> {
    // Filter controller metadata to only include arg definitions
    // for this action
    const filteredArguments: RouteArgument[] = args.filter(
      (arg: RouteArgument): boolean => arg.argFor === methodName,
    );

    // Metadata is assigned in a non-deterministic order, so
    // ensure order by sorting on index.
    filteredArguments.sort((a: RouteArgument, b: RouteArgument): number =>
      a.index - b.index
    );

    // Determined by the type of parameter decorator used, map the
    // arguments metadata onto the appropriate data source
    return filteredArguments.map((arg: RouteArgument): any => {
      switch (arg.type) {
        case ArgsType.PARAM:
          if (typeof arg.key === "undefined") {
            return params;
          }
          return params[arg.key];
        case ArgsType.BODY:
          if (typeof arg.key === "undefined") {
            return body.value;
          }
          return body.value[arg.key];
        case ArgsType.QUERY:
          if (typeof arg.key === "undefined") {
            return query;
          }
          return query[arg.key];
        case ArgsType.HEADER:
          if (typeof arg.key === "undefined") {
            return headers;
          }
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
   * Helper method for returning correct status code
   * 
   * Return either the default response code specified by `@HttpStatus` Method Decorator
   * or return default response `200`, or `201` if post
   */
  private getStatus(meta: ControllerMetadata, route: RouteDefinition): number {
    const isPostRequest: boolean = route.requestMethod === HttpMethod.POST;
    return meta.defaultResponseCodes.get(route.methodName) ??
      (isPostRequest ? 201 : 200);
  }
  /**
   * Helper method that combines controller prefix with route path.
   * 
   * If the path terminates in `/`, slice it.
   */
  private normalizedPath(prefix: string, path: string) {
    let normalizedPath: string = prefix + path;
    if (normalizedPath.slice(-1) === "/") {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    return normalizedPath;
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
   * Returns message to be displayed when application starts
   */
  public getBootstrapMsg(): string {
    return this.bootstrapMsg;
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
   * Helper that updates the internal bootstrap message. Used on application start
   * to display on screen success.
   */
  private appendToBootstrapMsg(msg: string): string {
    this.bootstrapMsg += msg;
    return this.bootstrapMsg;
  }
}
