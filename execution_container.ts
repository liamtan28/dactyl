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
  #route: RouteDefinition;
  #context: RouterContext;

  constructor(controllerDefinition: Newable<T>, route: RouteDefinition, context: RouterContext) {
    this.#controllerDefinition = controllerDefinition;
    this.#route = route;

    this.#context = context;
    const meta: ControllerMetadata | undefined = getControllerOwnMeta(this.#controllerDefinition);

    if (!meta || !meta.prefix) {
      throw new Error("Attempted to register non-controller class");
    }
    this.#controllerMeta = meta;
  }

  #retrieveFromContext = async (): Promise<{
    params: any;
    headers: any;
    query: any;
    body: any;
  }> => {
    const url: URL = this.#context.request.url;
    const headersRaw: Headers = this.#context.request.headers;
    const params: any = this.#context.params;

    const headers: any = {};

    for (const [key, value] of headersRaw.entries()) {
      headers[key] = value;
    }

    const query: any = {};
    for (const [key, value] of url.searchParams.entries()) {
      query[key] = value;
    }

    let body: any = {};
    if (this.#context.request.hasBody) {
      body.value = await this.#context.request.body().value;
    }

    return { params, headers, query, body };
  };

  /**
   * Helper method for constructing controller action arguments
   * from metadata on the controller.
   */
  #buildRouteArgumentsFromMeta = async (): Promise<Array<any>> => {
    const { params, headers, query, body } = await this.#retrieveFromContext();
    // Filter controller metadata to only include arg definitions
    // for this action
    const filteredArguments: RouteArgument[] = this.#controllerMeta.args.filter(
      (arg: RouteArgument): boolean => arg.argFor === this.#route.methodName
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
          return this.#context;
        case ArgsType.REQUEST:
          return this.#context.request;
        case ArgsType.RESPONSE:
          return this.#context.response;
        default:
          throw null;
      }
    });
  };

  #executeBeforeFns = async (): Promise<void> => {
    const { params, headers, query, body } = await this.#retrieveFromContext();
    const methodName: string = this.#route.methodName as string;
    const beforeFns: Array<Function> = this.#controllerMeta.beforeFns.get(methodName) ?? [];

    for (const fn of beforeFns) {
      await fn(body.value, params, query, headers, this.#context);
    }
  };

  #handleError = (error: any): Array<any> => {
    if (!(error instanceof HttpException)) {
      console.error(error);
      error = new InternalServerErrorException();
    }
    return [error.getError().status, error.getError()];
  };

  #getStatus = (): Status => {
    const isPostRequest: boolean = this.#route.requestMethod === HttpMethod.POST;
    return (
      this.#controllerMeta.defaultResponseCodes.get(this.#route.methodName) ??
      (isPostRequest ? Status.Created : Status.OK)
    );
  };

  async execute(): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: false,
      body: {},
      status: Status.OK,
    };

    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    // Using the controller metadata and data from context, build controller args
    const args: Array<any> = await this.#buildRouteArgumentsFromMeta();

    // execute any defined before actions. If any fails, this will
    // return true. If it does return true, context response as
    // been set so return early and skip controller action
    try {
      await this.#executeBeforeFns();
    } catch (e) {
      const [errorStatus, errorBody] = this.#handleError(e);
      result.body = errorBody;
      result.status = errorStatus;
      return result;
    }

    try {
      // Resolve dependencies from container and construct controller
      const types: Array<string> = getConstructorTypes(this.#controllerDefinition).map(
        (type: any): string => type.name
      );
      const resolvedDependencies: Array<any> = [];
      for (const type of types) {
        resolvedDependencies.push(lifetime.resolve(type));
      }

      const instance: any = new this.#controllerDefinition(...resolvedDependencies);

      // execute action here.
      const controllerResponse: any = await instance[this.#route.methodName as string](...args);

      // Body has manually been set
      if (!controllerResponse && this.#context.response.body) {
        result.status = this.#context.response.status ?? this.#getStatus();
        result.body = this.#context.response.body;
      } // No body set and no response, 204
      else if (!controllerResponse && !this.#context.response.body) {
        result.status = 204;
        result.body = null;
      } // Return value from controller action
      else {
        result.status = this.#getStatus();
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
