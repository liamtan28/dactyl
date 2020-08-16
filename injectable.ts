// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { setInjectableMetadata } from "./metadata.ts";
import { EInjectionScope } from "./types.ts";

/**
 * Curried function responsible for setting injectable
 * metadata on target injectables
 */
export function Injectable(scope: EInjectionScope) {
  return function (target: Function) {
    setInjectableMetadata(target, scope);
  };
}
