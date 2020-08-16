// Copyright 2020 Liam Tan. All rights reserved. MIT license.

/**
 * Metadata utility file - helper methods for assigning and retrieving
 * values from the Reflect API, for use across lib
 */
import { Reflect } from "./lib/reflect.ts";
import { ControllerMetadata, RouteDefinition, EInjectionScope } from "./types.ts";

/**
 * Key used to identify controller metadata across framework. This
 * is not exposed to user, only used internally to assign and
 * retrieve metadata appropriately.
 */
export const CONTROLLER_META_PROPKEY = Symbol("dactyl:controller_metadata");
export const INJECTION_SCOPE_META_TOKEN: Symbol = Symbol("dactyl:injection_scope");
export const CONSTRUCTOR_TYPE_META_TOKEN: string = "design:paramtypes";

export function getConstructorTypes(target: Function): Array<Function> {
  return Reflect.getMetadata(CONSTRUCTOR_TYPE_META_TOKEN, target);
}
/**
 * Helper method for setting metadata on injectable
 */
export function setInjectableMetadata(target: Function, scope: EInjectionScope): void {
  Reflect.defineMetadata(INJECTION_SCOPE_META_TOKEN, scope, target);
}
/**
 * Helper method for retrieving metadata of injectable
 */
export function getInjectableMetadata(target: Function): EInjectionScope {
  return Reflect.getMetadata(INJECTION_SCOPE_META_TOKEN, target);
}
/**
 * Helper method for retrieving metadata of controller definition
 */
export function getControllerOwnMeta(target: Function): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_META_PROPKEY, target);
}

/**
 * Helper method for retrieving metadata of controller
 */
export function getControllerMeta(target: Object): ControllerMetadata | undefined {
  return getControllerOwnMeta(target.constructor);
}
/**
 * Helper method for setting controller own metadata with a given value.
 */
export function setControllerOwnMeta(target: Function, value: ControllerMetadata): void {
  Reflect.defineMetadata(CONTROLLER_META_PROPKEY, value, target);
}

/**
 * Helper method for setting controller metadata with a
 * given updated value
 */
export function setControllerMeta(target: Object, value: ControllerMetadata): void {
  setControllerOwnMeta(target.constructor, value);
}
/**
 * Helper method that returns the default metadata object.
 */
export function defaultMetadata(): ControllerMetadata {
  return {
    prefix: null,
    routes: new Map<string, RouteDefinition>(),
    args: [],
    defaultResponseCodes: new Map<string, number>(),
    beforeFns: new Map<string, Array<Function>>(),
  };
}
