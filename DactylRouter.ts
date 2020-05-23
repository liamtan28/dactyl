import { Router as OakRouter } from "./deps.ts";
import {
  RouteDefinition,
  EHttpMethod,
  ActionArgsDefinition,
  EArgsType,
} from "./model.ts";
import { HttpException } from "./HttpException.ts";

/**
 * The bread and butter Router class, responsible for reading all metadata
 * defined by controllers and their methods, and appropriately setting
 * up the vanilla express router to behave as expected
 */
export class DactylRouter {
  // This value is returned and provided to the app once all metadata has
  // been appropriately converted to route handlers here
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
    // Create an instance of the controller class supplied as an
    // argument.
    const instance: any = new controller();

    // Retreive all controller metadata for request routing

    // Controller prefix
    const prefix: string = Reflect.get(controller, "prefix");
    // Params for each controller action
    const paramDefinitions: Map<string, ActionArgsDefinition[]> = Reflect.get(
      controller,
      "params",
    );
    // Body for each controller action
    const bodyDefinitions: Map<string, ActionArgsDefinition[]> = Reflect.get(
      controller,
      "body",
    );
    // Query for each controller action
    const queryDefinitions: Map<string, ActionArgsDefinition[]> = Reflect.get(
      controller,
      "query",
    );
    // Default status codes
    const statusCodes: Map<string, number> = Reflect.get(
      controller,
      "response_status_codes",
    );

    const routes: Array<RouteDefinition> = Reflect.get(controller, "routes");
    console.info(
      `  ${prefix}`,
    );
    // For each provided route, a handler must be defined on the express router
    // according to the specified behaviour in the metadata of the controller.
    // We can expect this route metadata to be supplied in the form of a
    // RouteDefinition interface
    routes.forEach((route: RouteDefinition): void => {
      console.info(
        `     [${route.requestMethod.toUpperCase()}] ${route.path}`,
      );
      // the whole path for this route, according to the prefix defined on
      // the Controller class decorator, and the path specified by the
      // method decorator
      const path: string = prefix + route.path;
      // given an example GET Request on the path api/user, this
      // statement will evaluate as:
      // this.router.get('api/user', (req, res) => /* handler */);

      this.router[route.requestMethod](
        path,
        async (context: any): Promise<void> => {
          // A top level try/catch control statement is defined so that
          // any exceptions raised explicitly (HttpException), or any
          // unknown exception can be handled safely. The top level
          // function is async, and the response from the controller
          // method is awaited in case it is async and thus
          // returns a promise, meaning that any promise
          // with an uncaught rejection will also be
          // appropriately caught here.
          try {
            // Retreive this controller actions specific param definitions
            const actionParams: ActionArgsDefinition[] = paramDefinitions.get(
              route.methodName,
            ) || [];
            const actionBody: ActionArgsDefinition[] = bodyDefinitions.get(
              route.methodName,
            ) || [];
            const actionQuery: ActionArgsDefinition[] = queryDefinitions.get(
              route.methodName,
            ) || [];
            // merge all body and params together
            const args: ActionArgsDefinition[] = [
              ...actionParams,
              ...actionBody,
              ...actionQuery,
            ];

            // Sort params by index to ensure order
            args.sort((a: ActionArgsDefinition, b: ActionArgsDefinition) =>
              a.index - b.index
            );
            const url: URL = context.request.url;
            // Retreive actual params from route
            const paramsFromContext: any = context.params;
            const headersFromContext: Headers = context.request.headers;
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
            const params: any[] = args.map((
              arg: ActionArgsDefinition,
            ): any => {
              //paramsFromContext[param.key]
              switch (arg.type) {
                case EArgsType.PARAMS:
                  return paramsFromContext[arg.key];
                case EArgsType.BODY:
                  return bodyFromContext.value[arg.key];
                case EArgsType.QUERY:
                  return queryFromContext[arg.key];
                default:
                  // TODO probably bad way here, but should
                  // get 500 if weird argsdefinition
                  throw null;
              }
            });
            // execute controller action here. Assume async. If not,
            // controller action will just be wrapped in Promise
            const response = await instance[route.methodName](...params);

            // In the example that the controller method returned no data, but
            // the response object was accessed directly and thus has finished
            // replying to the client, return early as no more has to be done.
            // TODO cehck if this works the same in deno
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
            const statusCode: number = (statusCodes
              ? statusCodes.get(route.methodName)
              : null) ||
              (route.requestMethod == EHttpMethod.POST ? 201 : 200);
            // If we have reached the end of the control statement, the response
            // is ready to be sent. Specify the status code and respond to the
            // client with the response from the controller method.
            context.response.body = response;
            context.response.status = statusCode;
          } catch (error) {
            // If the error thrown was an HttpException from the
            // library provided, then appropriately throw that
            // error and send it to the user. If not, then
            // call the handleUnknownException method and
            // deal with it appropriately
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
        },
      );
    });
    console.info("");
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
      `* Route:                                 ${Reflect.get(
        controller,
        "prefix",
      ) + route.path}\n`,
      `* Controller method name:                ${route.methodName}\n`,
      `* HTTP method type:                      ${route.requestMethod}\n`,
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
    res: any,
  ): void {
    // Notify the user of the error, including all metadata associated with the
    // request.
    console.error(
      ` * Error - Unknown exception thrown: ${
        controller.toString().split(" ")[1]
      }\n`,
      `* Route:                    ${Reflect.get(controller, "prefix") +
        route.path}\n`,
      `* Controller method name:   ${route.methodName}\n`,
      `* HTTP method type:         ${route.requestMethod}\n`,
    );
    // Return a 500 error to the user.
    res.status = 500;
    res.body = {
      error: "Internal Server Error",
      status: 500,
    };
  }
}
