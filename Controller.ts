// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { ControllerMetadata, RouteDefinition } from "./types.ts";
import {
  setControllerMetaIfNotDefined,
  getControllerMeta,
  setControllerMeta,
} from "./metadata.ts";
/**
 * Controller Class decorator responsible for initialising metadata on the controller class.
 * Defines the `prefix` for all subsequent routes defined on the controller.
 */
export function Controller(prefix: string = "/"): ClassDecorator {
  return (target: Function): void => {
    setControllerMetaIfNotDefined(target, {
      prefix,
      routes: new Map<string, RouteDefinition>(),
    });

    const meta: ControllerMetadata = getControllerMeta(target);
    meta.prefix = prefix;
    setControllerMeta(target, meta);
  };
}
