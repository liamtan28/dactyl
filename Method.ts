// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { HttpMethod, ControllerMetadata } from "./types.ts";
import {
  getControllerMeta,
  defaultMetadata,
  setControllerMeta,
} from "./metadata.ts";

// When we need type metadata (i.e. Reflect.getMetadata)
// We polyfill Reflect api
import "./polyfill/Reflect.ts";

/**
 * Responsible for producing function decorators for all given HttpMethods.
 * Uses a curried function to return the function decorator.
 */
const defineRouteDecorator = (
  path: string = "/",
  requestMethod: HttpMethod,
): MethodDecorator =>
  (
    target: any,
    propertyKey: string | Symbol,
  ): void => {
    const meta: ControllerMetadata = getControllerMeta(target) ??
      defaultMetadata();

    meta.routes.set(propertyKey, {
      requestMethod,
      path,
      methodName: propertyKey,
    });

    // As the method is initialised, set the argTypes
    // meta for document autogeneration
    const argTypes: Array<string> = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey as string,
    ).map((type: Function): string => type.name.toLowerCase());

    meta.argTypes.set(propertyKey as string, argTypes);

    setControllerMeta(target, meta);
  };

/**
 * Method decorator function for mapping Get requests.
 *
 * `path` will be the routed path with the prefix of the
 * parent controller prefix, E.g.
 *
 * ```ts
 *  @Controller('api')
 *  class DefaultController {
 *    @Get('/:id')
 *    public controllerAction(): any {}
 *  }
 * ```
 *
 * The above action `controllerAction` will then be mapped
 * to `GET` requests that match pattern `api/:id`
 */
export function Get(path?: string): MethodDecorator {
  return defineRouteDecorator(path, HttpMethod.GET);
}
/**
 * Method decorator function for mapping Put requests.
 *
 * `path` will be the routed path with the prefix of the
 * parent controller prefix, E.g.
 *
 * ```ts
 *  @Controller('api')
 *  class DefaultController {
 *    @Put('/:id')
 *    public controllerAction(): any {}
 *  }
 * ```
 *
 * The above action `controllerAction` will then be mapped
 * to `PUT` requests that match pattern `api/:id`
 */
export function Put(path?: string): MethodDecorator {
  return defineRouteDecorator(path, HttpMethod.PUT);
}
/**
 * Method decorator function for mapping Post requests.
 *
 * `path` will be the routed path with the prefix of the
 * parent controller prefix, E.g.
 *
 * ```ts
 *  @Controller('api')
 *  class DefaultController {
 *    @Post('/:id')
 *    public controllerAction(): any {}
 *  }
 * ```
 *
 * The above action `controllerAction` will then be mapped
 * to `POST` requests that match pattern `api/:id`
 */
export function Post(path?: string): MethodDecorator {
  return defineRouteDecorator(path, HttpMethod.POST);
}
/**
 * Method decorator function for mapping Patch requests.
 *
 * `path` will be the routed path with the prefix of the
 * parent controller prefix, E.g.
 *
 * ```ts
 *  @Controller('api')
 *  class DefaultController {
 *    @Patch('/:id')
 *    public controllerAction(): any {}
 *  }
 * ```
 *
 * The above action `controllerAction` will then be mapped
 * to `PATCH` requests that match pattern `api/:id`
 */
export function Patch(path?: string): MethodDecorator {
  return defineRouteDecorator(path, HttpMethod.PATCH);
}
/**
 * Method decorator function for mapping Delete requests.
 *
 * `path` will be the routed path with the prefix of the
 * parent controller prefix, E.g.
 *
 * ```ts
 *  @Controller('api')
 *  class DefaultController {
 *    @Delete('/:id')
 *    public controllerAction(): any {}
 *  }
 * ```
 *
 * The above action `controllerAction` will then be mapped
 * to `DELETE` requests that match pattern `api/:id`
 */
export function Delete(path?: string): MethodDecorator {
  return defineRouteDecorator(path, HttpMethod.DELETE);
}
