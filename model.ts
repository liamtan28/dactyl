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

export interface RouteDefinition {
  // Path to our route
  path: string;
  // HTTP Request method (get, post, ...)
  requestMethod: EHttpMethod;
  // Method name within our class responsible for this route
  methodName: string;
}
