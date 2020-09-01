// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { ControllerMetadata, EInjectionScope } from "./types.ts";
import { getControllerOwnMeta, setControllerOwnMeta, defaultMetadata } from "./metadata.ts";
/**
 * Controller Class decorator responsible for initialising metadata on the controller class.
 * Defines the `prefix` for all subsequent routes defined on the controller.
 */
export function Controller(prefix: string = "/", scope?: EInjectionScope): ClassDecorator {
  return (target: Function): void => {
    const meta: ControllerMetadata = getControllerOwnMeta(target) ?? defaultMetadata();

    meta.prefix = prefix;
    if (scope) {
      meta.scope = scope;
    }
    setControllerOwnMeta(target, meta);
  };
}
