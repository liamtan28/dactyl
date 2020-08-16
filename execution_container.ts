// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { RouterContext, Status } from "./deps.ts";
import {
  Newable,
  ExecutionResult,
  ControllerMetadata,
  RouteDefinition,
  RouteArgument,
  ArgsType,
  HttpMethod,
  RequestLifetime,
} from "./types.ts";
import { getControllerOwnMeta, getConstructorTypes } from "./metadata.ts";
import { HttpException, InternalServerErrorException } from "./HttpException.ts";
import DIContainer from "./dependency_container.ts";

/** class that executes a controller action with context */
export class ExecutionContainer<T> {
  #controllerDefinition: Newable<T>;
  #controllerMeta: ControllerMetadata;

  constructor(controllerDefinition: Newable<T>) {
    this.#controllerDefinition = controllerDefinition;
    this.#controllerMeta = <ControllerMetadata>getControllerOwnMeta(this.#controllerDefinition);
  }

  #retrieveFromContext = async (
    context: RouterContext
  ): Promise<{
    params: any;
    headers: any;
    query: any;
    body: any;
  }> => {
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
    if (context.request.hasBody) {
      body.value = await context.request.body().value;
    }

    return { params, headers, query, body };
  };

  /**
   * Helper method for constructing controller action arguments
   * from metadata on the controller.
   */
  #buildRouteArgumentsFromMeta = async (
    route: RouteDefinition,
    context: RouterContext,
    lifetime: RequestLifetime
  ): Promise<Array<any>> => {
    const { params, headers, query, body } = await this.#retrieveFromContext(context);
    // Filter controller metadata to only include arg definitions
    // for this action
    const filteredArguments: RouteArgument[] = this.#controllerMeta.args.filter(
      (arg: RouteArgument): boolean => arg.argFor === route.methodName
    );

    // Metadata is assigned in a non-deterministic order, so
    // ensure order by sorting on index.
    filteredArguments.sort((a: RouteArgument, b: RouteArgument): number => a.index - b.index);

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
        case ArgsType.INJECT:
          return lifetime.resolve(String(arg.key));
        default:
          throw null;
      }
    });
  };

  #executeBeforeFns = async (route: RouteDefinition, context: RouterContext): Promise<void> => {
    const { params, headers, query, body } = await this.#retrieveFromContext(context);
    const methodName: string = route.methodName as string;
    const beforeFns: Array<Function> = this.#controllerMeta.beforeFns.get(methodName) ?? [];

    for (const fn of beforeFns) {
      await fn(body.value, params, query, headers, context);
    }
  };

  #handleError = (error: any): Array<any> => {
    if (!(error instanceof HttpException)) {
      console.error(error);
      error = new InternalServerErrorException();
    }
    return [error.getError().status, error.getError()];
  };

  #getStatus = (route: RouteDefinition): Status => {
    const isPostRequest: boolean = route.requestMethod === HttpMethod.POST;
    return (
      this.#controllerMeta.defaultResponseCodes.get(route.methodName) ??
      (isPostRequest ? Status.Created : Status.OK)
    );
  };

  async execute(route: RouteDefinition, context: RouterContext): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: false,
      body: {},
      status: Status.OK,
    };

    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    // Using the controller metadata and data from context, build controller args
    const args: Array<any> = await this.#buildRouteArgumentsFromMeta(route, context, lifetime);

    // execute any defined before actions. If any fails, this will
    // return true. If it does return true, context response as
    // been set so return early and skip controller action
    try {
      await this.#executeBeforeFns(route, context);
    } catch (e) {
      const [errorStatus, errorBody] = this.#handleError(e);
      result.body = errorBody;
      result.status = errorStatus;
      return result;
    }

    try {
      const autoInject: boolean = this.#controllerMeta.autoInject;
      const resolvedDependencies: Array<any> = [];
      if (autoInject) {
        // Resolve dependencies from container and construct controller
        const types: Array<string> = getConstructorTypes(this.#controllerDefinition).map(
          (type: any): string => type.name
        );
        for (const type of types) {
          resolvedDependencies.push(lifetime.resolve(type));
        }
      }

      const instance: any = new this.#controllerDefinition(...resolvedDependencies);

      // execute action here.
      const controllerResponse: any = await instance[route.methodName as string](...args);

      // Body has manually been set
      if (!controllerResponse && context.response.body) {
        result.status = context.response.status ?? this.#getStatus(route);
        result.body = context.response.body;
      } // No body set and no response, 204
      else if (!controllerResponse && !context.response.body) {
        result.status = 204;
        result.body = null;
      } // Return value from controller action
      else {
        result.status = this.#getStatus(route);
        result.body = controllerResponse;
      }
      result.success = true;
    } catch (error) {
      const [errorStatus, errorBody] = this.#handleError(error);
      result.status = errorStatus;
      result.body = errorBody;
    }

    // End request lifetime when execution container is finished
    lifetime.end();

    return result;
  }
}
