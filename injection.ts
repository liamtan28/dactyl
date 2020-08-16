// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import {
  setInjectableMetadata,
  getControllerOwnMeta,
  defaultMetadata,
  setControllerOwnMeta,
} from "./metadata.ts";
import { EInjectionScope, ControllerMetadata } from "./types.ts";

/**
 * Curried function responsible for setting injectable
 * metadata on target injectables
 */
export function Injectable(scope: EInjectionScope) {
  return function (target: Function) {
    setInjectableMetadata(target, scope);
  };
}
/**
 * Curried function responsible for setting autoinject
 * property to true on controllers
 */
export function AutoInject() {
  return (target: Function): void => {
    const meta: ControllerMetadata = getControllerOwnMeta(target) ?? defaultMetadata();
    meta.autoInject = true;
    setControllerOwnMeta(target, meta);
  };
}
