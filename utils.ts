// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { log } from "./deps.ts";

/**
 * Utility function for throwing an error gracefully without using
 * global top level error exit.
 */
export function throwCompileTimeError(msg: string, code?: number) {
  log.error(`Compile-time error: ${msg}`);
  Deno.exit(code ?? 1);
}
