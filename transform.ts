// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { RouterContext, Status } from "./deps.ts";
import { RequestLifetime, RouteDefinition, RouteArgument, ArgsType, HttpMethod } from "./types.ts";
/***
 * Transform utilities. Used mainly by execution container to extract information from
 * both the context and DIContainer, and apply transforms to the data in a
 * consumable format.
 */

/**
 * Helper function that takes a context and returns consumable
 * `params, headers, query, body`.
 */
export async function retrieveFromContext(
  context: RouterContext
): Promise<{
  params: any;
  headers: any;
  query: any;
  body: any;
}> {
  const url: URL = context.request.url;
  const headersRaw: Headers = context.request.headers;
  const params: any = context.params;

  const headers: any = {};

  for (const [key, value] of headersRaw.entries()) {
    headers[key] = value;
  }

  const query: any = {};
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }

  let body: any = {};
  if (context.request.hasBody) {
    body.value = await context.request.body().value;
  }

  return { params, headers, query, body };
}

/**
 * Helper method for constructing controller action arguments
 * from metadata on the controller.
 */
export async function buildRouteArgumentsFromMeta(
  args: Array<RouteArgument>,
  route: RouteDefinition,
  context: RouterContext,
  lifetime: RequestLifetime
): Promise<Array<any>> {
  const { params, headers, query, body } = await retrieveFromContext(context);
  // Filter controller metadata to only include arg definitions
  // for this action
  const filteredArguments: RouteArgument[] = args.filter(
    (arg: RouteArgument): boolean => arg.argFor === route.methodName
  );

  // Metadata is assigned in a non-deterministic order, so
  // ensure order by sorting on index.
  filteredArguments.sort((a: RouteArgument, b: RouteArgument): number => a.index - b.index);

  // Determined by the type of parameter decorator used, map the
  // arguments metadata onto the appropriate data source
  return filteredArguments.map((arg: RouteArgument): any => {
    switch (arg.type) {
      case ArgsType.PARAM:
        if (typeof arg.key === "undefined") {
          return params;
        }
        return params[arg.key];
      case ArgsType.BODY:
        if (typeof arg.key === "undefined") {
          return body.value;
        }
        return body.value[arg.key];
      case ArgsType.QUERY:
        if (typeof arg.key === "undefined") {
          return query;
        }
        return query[arg.key];
      case ArgsType.HEADER:
        if (typeof arg.key === "undefined") {
          return headers;
        }
        return headers[arg.key];
      case ArgsType.CONTEXT:
        return context;
      case ArgsType.REQUEST:
        return context.request;
      case ArgsType.RESPONSE:
        return context.response;
      case ArgsType.INJECT:
        return lifetime.resolve(String(arg.key));
      default:
        throw null;
    }
  });
}

/**
 * Execute before fns and supply them with the appropriate deconstructed
 * context
 */
export async function executeBeforeFns(
  beforeFns: Array<Function>,
  context: RouterContext
): Promise<void> {
  const { params, headers, query, body } = await retrieveFromContext(context);
  for (const fn of beforeFns) {
    await fn(body.value, params, query, headers, context);
  }
}

/**
 * Provided the route and the default response codes, return the correct
 * status code to send to the user.
 */
export function getStatus(
  route: RouteDefinition,
  responseCodes: Map<string | Symbol, number>
): Status {
  const isPostRequest: boolean = route.requestMethod === HttpMethod.POST;
  return (
    <Status>responseCodes.get(String(route.methodName)) ??
    (isPostRequest ? Status.Created : Status.OK)
  );
}
