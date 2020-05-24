// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { ControllerMetadata, RouteDefinition } from "./types.ts";
import {
  setMetaIfNotDefined,
  getMeta,
  setMeta,
  CONTROLLER_META_PROPKEY,
} from "./metadata.ts";
/**
 * Controller Class decorator responsible for initialising metadata on the controller class.
 * Defines the `prefix` for all subsequent routes defined on the controller.
 */
export function Controller(prefix: string = "/"): ClassDecorator {
  return (target: Function): void => {
    setMetaIfNotDefined(target, CONTROLLER_META_PROPKEY, {
      prefix,
      routes: new Map<string, RouteDefinition>(),
    });

    const meta: ControllerMetadata = getMeta(target, CONTROLLER_META_PROPKEY);
    meta.prefix = prefix;
    setMeta(target, CONTROLLER_META_PROPKEY, meta);
  };
}
