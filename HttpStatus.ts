// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { ensureController, getControllerMeta, setControllerMeta } from "./metadata.ts";

import { ControllerMetadata } from "./types.ts";
import { Status } from "./deps.ts";

/**
 * HttpStatus MethodDecorator specifies the default response code of
 * a given controller action, E.g.
 *
 * ```ts
 * @HttpStatus(200)
 * public controllerAction() {}
 * ```
 */
export function HttpStatus(code: Status): MethodDecorator {
  return (target: any, propertyKey: string | Symbol): void => {
    ensureController(target.constructor);

    const meta: ControllerMetadata = getControllerMeta(target.constructor);
    meta.defaultResponseCodes.set(propertyKey, code);
    setControllerMeta(target.constructor, meta);
  };
}
