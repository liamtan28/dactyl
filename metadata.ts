// Copyright 2020 Liam Tan. All rights reserved. MIT license.

/**
 * Metadata utility file - helper methods for assigning and retrieving
 * values from the Reflect API, for use across lib
 */

import { ControllerMetadata, RouteDefinition } from "./types.ts";

/**
 * Key used to identify controller metadata across framework. This
 * is not exposed to user, only used internally to assign and
 * retrieve metadata appropriately.
 */
export const CONTROLLER_META_PROPKEY = "dactyl_controller_metadata";

/**
 * Helper method for retrieving metadata of controller
 */
export function getControllerMeta(target: object): ControllerMetadata | undefined {
  return Reflect.get(target, CONTROLLER_META_PROPKEY);
}
/**
 * Helper method for setting controller metadata with a
 * given updated value
 */
export function setControllerMeta(target: object, value: ControllerMetadata): void {
  Reflect.defineProperty(target, CONTROLLER_META_PROPKEY, { value });
}
/**
 * Helper method that only assigns controller meta if it doesn't
 * exist on the target.
 *
 * Used in `ensureController` to only set
 * default meta if the `@Controller` decorator has not been
 * used on the target yet
 */
export function setControllerMetaIfNotDefined(target: object, value: ControllerMetadata): void {
  if (!Reflect.has(target, CONTROLLER_META_PROPKEY)) {
    setControllerMeta(target, value);
  }
}
/**
 * Helper method that ensures a target has already had it's controller
 * metadata assigned. If it hasn't, it will assign the default
 * metadata.
 */
export function ensureController(target: object): void {
  const meta: ControllerMetadata = {
    prefix: null,
    routes: new Map<string, RouteDefinition>(),
    args: [],
    defaultResponseCodes: new Map<string, number>(),
  };
  setControllerMetaIfNotDefined(target, meta);
}
