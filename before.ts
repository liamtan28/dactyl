// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { defaultMetadata, getControllerMeta, setControllerMeta } from "./metadata.ts";
import { ControllerMetadata } from "./types.ts";

/**
 * `MethodDecorator` responsible for assigning metadata to given method of function
 * to be triggered before request is executed. Useful for validation or logging
 * purposes
 */
export function Before(fn: Function): MethodDecorator {
  return (target: any, propertyKey: string | Symbol): void => {
    const meta: ControllerMetadata = getControllerMeta(target) ?? defaultMetadata();
    const beforeFns = meta.beforeFns.get(propertyKey as string) ?? [];
    beforeFns.push(fn);
    meta.beforeFns.set(propertyKey as string, beforeFns);
    setControllerMeta(target, meta);
  };
}
