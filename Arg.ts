// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { ArgsType, ControllerMetadata } from "./types.ts";
import {
  setControllerMeta,
  getControllerMeta,
  defaultMetadata,
} from "./metadata.ts";

/**
 * Curried function responsible for generating parameter decorators
 * for controller actions.
 */
export const defineParameterDecorator = (
  argType: ArgsType,
  paramKey?: string,
): ParameterDecorator =>
  (
    target: any,
    propertyKey: string | Symbol,
    parameterIndex: number,
  ): void => {
    const meta: ControllerMetadata = getControllerMeta(target) ??
      defaultMetadata();

    meta.args.push({
      type: argType,
      key: paramKey,
      index: parameterIndex,
      argFor: propertyKey,
    });

    setControllerMeta(target, meta);
  };

/**
 * Parameter decorator - maps `context.params` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Param('id') id: number): any {}
 * ```
 * 
 * Returns whole `context.params` object if no key specified
 */
export function Param(paramKey?: string): ParameterDecorator {
  return defineParameterDecorator(ArgsType.PARAM, paramKey);
}
/**
 * Parameter decorator - maps `context.request.body()` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Body('name') name: string): any { }
 * ```
 * 
 * Returns whole `context.request.body()` if no key specified
 */
export function Body(bodyKey?: string): ParameterDecorator {
  return defineParameterDecorator(ArgsType.BODY, bodyKey);
}
/**
 * Parameter decorator - maps `url.searchParams.entries()` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Query('orderBy') orderBy: string): any { }
 * ```
 * 
 * Returns whole `url.searchParams.entries()` if no key specified.
 */
export function Query(queryKey?: string): ParameterDecorator {
  return defineParameterDecorator(ArgsType.QUERY, queryKey);
}
/**
 * Parameter decorator - maps `context.request.headers` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Header('content-type') contentType: string): any { }
 * ```
 * Returns whole `context.request.headers` if no key specified
 */
export function Header(headerKey?: string): ParameterDecorator {
  return defineParameterDecorator(ArgsType.HEADER, headerKey);
}
/**
 * Parameter decorator - maps whole `context` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Context() ctx: RouterContext): any { }
 * ```
 */
export function Context(): ParameterDecorator {
  return defineParameterDecorator(ArgsType.CONTEXT);
}
/**
 * Parameter decorator - maps `context.request` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Request() req: Request): any { }
 * ```
 */
export function Request(): ParameterDecorator {
  return defineParameterDecorator(ArgsType.REQUEST);
}
/**
 * Parameter decorator - maps `context.response` onto controller actions
 * as an argument, e.g.
 *
 * ```ts
 * public controllerAction(@Response() res: Response): any { }
 * ```
 */
export function Response(): ParameterDecorator {
  return defineParameterDecorator(ArgsType.RESPONSE);
}
