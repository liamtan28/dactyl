// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Status, STATUS_TEXT, Context, red, yellow, green, log, white } from "./deps.ts";

/**********
 * LOGGER
 */

// configure logger globally to be consumed by logger middleware
await log.setup({
  handlers: {
    requestLogger: new log.handlers.ConsoleHandler("INFO", {
      formatter(logRecord): string {
        return white(`${logRecord.datetime.toTimeString()} ${logRecord.msg}`);
      },
    }),
  },
  loggers: {
    requestLogger: {
      level: "INFO",
      handlers: ["requestLogger"],
    },
  },
});

// store private reference to logger with formatting configured
const _logger: log.Logger = log.getLogger("requestLogger");

/**
 * Helper function for determining status color, based on status
 */
function _getColorFn(status: Status): Function {
  const statusPrefix: string = status.toString()[0];
  if (statusPrefix === "3") {
    return yellow;
  } else if (statusPrefix === "4" || statusPrefix === "5") {
    return red;
  }
  return green;
}

/**
 * Middleware function to be used by `Application`. Logs to info,
 * with correctly formatted and colored message based on status
 */
export async function logger(context: Context, next: Function): Promise<void> {
  const { method, url }: { method: string; url: URL } = context.request;

  await next();

  const status: Status = context.response.status ?? Status.OK;

  const pathMsg: string = `[${method.toUpperCase()}] - ${url.pathname}`;
  const statusMsg: string = _getColorFn(status)(`[${status} ${STATUS_TEXT.get(status)}]`);

  _logger.info(`${pathMsg} - ${statusMsg}`);
}

/**********
 * TIMING
 */

/**
 * Middleware function to be used by `Application`.
 * Sets timing header based on before and after
 * times of request
 */
export async function timing(context: Context, next: Function): Promise<void> {
  const start: number = Date.now();
  await next();
  const ms: number = Date.now() - start;
  context.response.headers.set("X-Response-Time", `${ms}ms`);
}

/********
 * CORS
 */

/**
 * Middleware function to be used by `Application`. Sets cors
 * to allow all remotes
 */
export async function cors(context: Context, next: Function): Promise<void> {
  context.response.headers.set(
    "Access-Control-Allow-Origin",
    context.request.headers.get("Origin") || "*"
  );
  context.response.headers.set(
    "Access-Control-Allow-Methods",
    context.request.headers.get("Access-Control-Request-Method") || "*"
  );
  context.response.headers.set(
    "Access-Control-Allow-Headers",
    context.request.headers.get("Access-Control-Request-Headers") || "*"
  );

  await next();
}
