export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
}

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
export interface ControllerMetadata {
  prefix: string | null;
  routes: Map<string | Symbol, RouteDefinition>;
  defaultResponseCodes: Map<string | Symbol, number>;
  args: RouteArgument[];
}
export interface RouteDefinition {
  // Path to our route
  path: string;
  // HTTP Request method (get, post, ...)
  requestMethod: HttpMethod;
  // Method name within our class responsible for this route
  methodName: string | Symbol;
}
export interface RouteArgument {
  type: ArgsType;
  index: number;
  key: string;
  argFor: string | Symbol;
}
export interface ApplicationConfig {
  controllers: any[];
}
