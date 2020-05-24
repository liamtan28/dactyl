import { Router as OakRouter } from "./deps.ts";
import {
  RouteDefinition,
  EHttpMethod,
  EArgsType,
  ControllerMetadata,
  RouteArgument,
} from "./types.ts";

import { HttpException } from "./HttpException.ts";
import { RouterContext } from "./deps.ts";
import { getMeta } from "./metadata.ts";

export class DactylRouter {
  private router: OakRouter;
  public constructor() {
    this.router = new OakRouter();
    console.info("\nDactyl Framework - Authored by Liam Tan 2020");
    console.info("Building routes...\nRouting structure below:\n");
  }
  /**
   * the register method is responsible for binding controllers to the
   * router. This is acheived by stripping the metadata from controllers
   * and creating tangible routes defined on the express router.
   */
  public register(controller: any): void {
    const instance: any = new controller();

    const meta: ControllerMetadata = getMeta(controller, "controllerMetadata");
    if (!meta || !meta.prefix) {
      throw new Error(
        "Attempted to register non-controller class to DactylRouter"
      );
    }
    console.info(`  ${meta.prefix}`);
    meta.routes.forEach((route: RouteDefinition): void => {
      console.info(`     [${route.requestMethod.toUpperCase()}] ${route.path}`);

      let path: string = meta.prefix + route.path;
      if (path.slice(-1) === "/") {
        path = path.slice(0, -1);
      }

      this.router[route.requestMethod](
        path,
        async (context: RouterContext): Promise<void> => {
          try {
            const [
              params,
              headers,
              query,
              body,
            ] = await this.retrieveFromContext(context);

            const routeArgs: any[] = this.buildRouteArgumentsFromMeta(
              meta.args,
              route.methodName,
              params,
              body,
              query,
              headers,
              context
            );
            // execute controller action here. Assume async. If not,
            // controller action will just be wrapped in Promise
            const response: any = await instance[route.methodName](
              ...routeArgs
            );

            // In the example that the controller method returned no data, but
            // the response object was accessed directly and thus has finished
            // replying to the client, return early as no more has to be done.
            if (!response && context.response.body) return;
            // If the response is empty, but there has been no response sent,
            // instead call the sendNoData method and reply with a 204
            // No Content. Warn the developer in dev mode as this was
            // likely a mistake.
            else if (!response && !context.response.body) {
              return this.sendNoData(route, controller, context.response);
            }
            // Generate the statusCode to reply with. If the method name
            // has a status code specified by the HttpStatus function
            // decorator, use that one. If none was specified, and
            // a default must be used, use 201 for POST requests,
            // and 200 for all others.
            const statusCode: number =
              meta.defaultResponseCodes.get(route.methodName) ||
              (route.requestMethod == EHttpMethod.POST ? 201 : 200);
            // If we have reached the end of the control statement, the response
            // is ready to be sent. Specify the status code and respond to the
            // client with the response from the controller method.
            context.response.body = response;
            context.response.status = statusCode;
          } catch (error) {
            // throw error here, or handle unknown error
            // if not of HttpException type
            if (error instanceof HttpException) {
              const response: {
                error: string;
                status: number;
              } = error.getError();
              context.response.status = response.status;
              context.response.body = response;
            } else {
              console.error(error);
              this.handleUnknownException(route, controller, context.response);
            }
          }
        }
      );
    });
    console.info("");
  }
  private async retrieveFromContext(context: RouterContext) {
    const url: URL = context.request.url;
    const headersRaw: Headers = context.request.headers;

    const paramsFromContext: any = context.params;

    const headersFromContext: any = {};
    for (const [key, value] of headersRaw.entries()) {
      headersFromContext[key] = value;
    }

    const queryFromContext: any = {};
    for (const [key, value] of url.searchParams.entries()) {
      queryFromContext[key] = value;
    }

    // TODO probably should use context.request.hasBody()
    // and some fancy logic to not call async action if
    // not needed
    const bodyFromContext: any = await context.request.body();
    // Map ParamDefinitions onto the actual params
    // from route
    return [
      paramsFromContext,
      headersFromContext,
      queryFromContext,
      bodyFromContext,
    ];
  }
  private buildRouteArgumentsFromMeta(
    args: RouteArgument[],
    methodName: string,
    params: any,
    body: any,
    query: any,
    headers: any,
    context: RouterContext
  ): any[] {
    // Filter out args for this specific controller action
    const filteredArguments: RouteArgument[] = args.filter(
      (arg: RouteArgument) => arg.argFor === methodName
    );
    // Sort params by index to ensure order
    filteredArguments.sort(
      (a: RouteArgument, b: RouteArgument) => a.index - b.index
    );

    return filteredArguments.map((arg: RouteArgument): any => {
      switch (arg.type) {
        case EArgsType.PARAM:
          return params[arg.key];
        case EArgsType.BODY:
          return body.value[arg.key];
        case EArgsType.QUERY:
          return query[arg.key];
        case EArgsType.HEADER:
          return headers[arg.key];
        case EArgsType.CONTEXT:
          return context;
        case EArgsType.REQUEST:
          return context.request;
        case EArgsType.RESPONSE:
          return context.response;
        default:
          // TODO probably bad way here, but should
          // get 500 if weird argsdefinition
          throw null;
      }
    });
  }
  /**
   * middleware getter for the internal router. To be used in application bootstrap
   * where appropriate. Also maps the last route, which is the 404 no match route.
   */
  public middleware(): any {
    // TODO fix this
    //this.router.use(this.notFoundHandler);
    return this.router.routes();
  }
  /**
   * not found handler. Will be called when no route matches. Simply
   * raises a 404 and sends it to the user.
   */
  private notFoundHandler(context: any): void {
    const res = context.response;
    res.status = 404;
    res.body = {
      error: "Not Found",
      status: 404,
    };
    // No need for NextFunction here as uncaught errors are dealt
    // with in the register function above.
  }
  /**
   * sendNoData method
   *
   * This method is called when a route has not returned any payload, and when
   * it has also not accessed the response object from express directly and
   * sent a request.
   */
  private sendNoData(route: RouteDefinition, controller: any, res: any): void {
    // Warn the user here that no data has been returned from the controller method.
    // It is important to do so as this is likely a mistake.
    console.warn(
      ` * Warning - Method returned no response: ${
        controller.toString().split(" ")[1]
      }\n`,
      `* Route:                                 ${
        Reflect.get(controller, "prefix") + route.path
      }\n`,
      `* Controller method name:                ${route.methodName}\n`,
      `* HTTP method type:                      ${route.requestMethod}\n`
    );
    // Send 204 No Content.
    res.status = 204;
  }
  /**
   * handleUnknownException method, returning 500 when no HttpException was explicitly
   * raised. This could be caused by an unhandled promise rejection, or a custom error
   * thrown either internally or from an external module.
   */
  private handleUnknownException(
    route: RouteDefinition,
    controller: any,
    res: any
  ): void {
    // Notify the user of the error, including all metadata associated with the
    // request.
    console.error(
      ` * Error - Unknown exception thrown: ${
        controller.toString().split(" ")[1]
      }\n`,
      `* Route:                    ${
        Reflect.get(controller, "prefix") + route.path
      }\n`,
      `* Controller method name:   ${route.methodName}\n`,
      `* HTTP method type:         ${route.requestMethod}\n`
    );
    // Return a 500 error to the user.
    res.status = 500;
    res.body = {
      error: "Internal Server Error",
      status: 500,
    };
  }
}
