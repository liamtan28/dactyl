// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { log } from "./deps.ts";
import { Context, Application } from "./deps.ts";
/**
 * Utility function for throwing an error gracefully without using
 * global top level error exit.
 */
export function throwCompileTimeError(msg: string, code?: number) {
  log.error(`Compile-time error: ${msg}`);
  Deno.exit(code ?? 1);
}

/**
 * TestUtils
 */
// Copyright 2018-2020 the oak authors. All rights reserved. MIT license.
// From Kitson Kelly's Oak Project https://github.com/oakserver/oak
export interface MockContextOptions<
  S extends Record<string | number | symbol, any> = Record<string, any>
> {
  app?: Application<S>;
  method?: string;
  params?: Record<string, string>;
  path?: string;
}

export function createMockApp<
  S extends Record<string | number | symbol, any> = Record<string, any>
>(state = {} as S): Application<S> {
  return {
    state,
  } as any;
}

export function createMockContext<
  S extends Record<string | number | symbol, any> = Record<string, any>
>({ app = createMockApp(), method = "GET", params, path = "/" }: MockContextOptions = {}) {
  const headers = new Headers();
  return ({
    app,
    params,
    request: {
      headers: new Headers(),
      method,
      url: new URL(path, "https://localhost/"),
    },
    response: {
      status: undefined,
      body: undefined,
      redirect(url: string | URL) {
        headers.set("Location", encodeURI(String(url)));
      },
      headers,
    },
    state: app.state,
  } as unknown) as Context<S>;
}
