// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { RouterContext, Status } from "./deps.ts";
import {
  ExecutionResult,
  ControllerMetadata,
  RouteDefinition,
  RouteArgument,
  RequestLifetime,
} from "./types.ts";
import { HttpException, InternalServerErrorException } from "./http_exception.ts";
import DIContainer from "./dependency_container.ts";

import * as transform from "./transform.ts";

/** class that executes a controller action with context */
export class ExecutionContainer {
  #controllerMeta: ControllerMetadata;
  #key: string;
  constructor(meta: ControllerMetadata, key: string) {
    this.#controllerMeta = meta;
    this.#key = key;
  }

  async execute(route: RouteDefinition, context: RouterContext): Promise<ExecutionResult> {
    const { buildRouteArgumentsFromMeta, executeBeforeFns, getStatus } = transform;
    const result: ExecutionResult = {
      success: false,
      body: {},
      status: Status.OK,
    };

    const lifetime: RequestLifetime = DIContainer.newRequestLifetime();

    const argDefinitions: Array<RouteArgument> = this.#controllerMeta.args;
    // Using the controller metadata and data from context, build controller args
    const args: Array<any> = await buildRouteArgumentsFromMeta(
      argDefinitions,
      route,
      context,
      lifetime
    );

    // execute any defined before actions. If any fails, this will
    // return true. If it does return true, context response as
    // been set so return early and skip controller action
    try {
      await executeBeforeFns(
        this.#controllerMeta.beforeFns.get(String(route.methodName)) ?? [],
        context
      );
    } catch (e) {
      const [errorStatus, errorBody] = this.#handleError(e);
      result.body = errorBody;
      result.status = errorStatus;
      return result;
    }

    try {
      const instance = lifetime.resolve(this.#key);

      // execute action here.
      const controllerResponse: any = await instance[String(route.methodName)](...args);

      // Body has manually been set
      if (!controllerResponse && context.response.body) {
        result.status =
          context.response.status ?? getStatus(route, this.#controllerMeta.defaultResponseCodes);
        result.body = context.response.body;
      } // No body set and no response, 204
      else if (!controllerResponse && !context.response.body) {
        result.status = 204;
        result.body = null;
      } // Return value from controller action
      else {
        result.status = getStatus(route, this.#controllerMeta.defaultResponseCodes);
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

  /**
   * Helper method for gracefully handling execution errors
   */
  #handleError = (error: any): Array<any> => {
    if (!(error instanceof HttpException)) {
      console.error(error);
      error = new InternalServerErrorException();
    }
    return [error.getError().status, error.getError()];
  };
}
