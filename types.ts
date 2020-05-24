export enum EHttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
}
export enum EHttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
}

export enum EArgsType {
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
  routes: Map<string, RouteDefinition>;
  defaultResponseCodes: Map<string, number>;
  args: RouteArgument[];
}
export interface RouteDefinition {
  // Path to our route
  path: string;
  // HTTP Request method (get, post, ...)
  requestMethod: EHttpMethod;
  // Method name within our class responsible for this route
  methodName: string;
}
export interface RouteArgument {
  type: EArgsType;
  index: number;
  key: string;
  argFor: string | Symbol;
}
export interface ApplicationConfig {
  controllers: any[];
}
