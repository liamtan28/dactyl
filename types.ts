// Copyright 2020 Liam Tan. All rights reserved. MIT license.

export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
}
/**
 * All parameter decorator types. When a route argument is declared
 * using a parameter decorator, the correct `ArgsType` is assigned
 * so that at runtime `Router` can determine where to retreive the
 * data from
 */
export enum ArgsType {
  PARAM = "param",
  BODY = "body",
  QUERY = "query",
  HEADER = "header",
  CONTEXT = "context",
  REQUEST = "request",
  RESPONSE = "response",
  COOKIE = "cookie",
}

/**
 * Metadata shape describing a controller and its
 * subsidiary routes. Includes all data in addtion
 * to routes like controller action args, response
 * codes
 */
export interface ControllerMetadata {
  prefix: string | null;
  routes: Map<string | Symbol, RouteDefinition>;
  defaultResponseCodes: Map<string | Symbol, number>;
  args: RouteArgument[];
}
/**
 * Route definition metadata, as mapped to a controller
 * action. Consumed in `ControllerMetadata` to build
 * routes that oak understands
 */
export interface RouteDefinition {
  path: string;
  requestMethod: HttpMethod;
  methodName: string | Symbol;
}
/**
 * Definition for a parameter decorator on a controller
 * action.
 */
export interface RouteArgument {
  type: ArgsType;
  index: number;
  key: string;
  argFor: string | Symbol;
}
/**
 * Root config for the `Application` class.
 */
export interface ApplicationConfig {
  controllers: any[];
}
