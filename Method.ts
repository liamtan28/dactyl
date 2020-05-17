import { RouteDefinition, EHttpMethod } from "./model.ts";
/**
 * Responsible for producing function decorators for all given HttpMethods.
 * Uses a curried function to return the function decorator.
 */
const defineRouteDecorator = (requestMethod: EHttpMethod) => (
  path: string
): any => (target: any, propertyKey: string): void => {
  // Define routes property on target constructor (the controller class) If it does not exist
  // This will occur only if this is the first method being defined on the controller.
  if (!Reflect.has(target.constructor, "routes")) {
    Reflect.defineProperty(target.constructor, "routes", { value: [] });
  }

  // Create a clone of the currently stored routes on the controller class, and push the new
  // value into it.
  const routes = Reflect.get(target.constructor, "routes") as RouteDefinition[];
  routes.push({
    requestMethod,
    path,
    methodName: propertyKey,
  });
  // Re-define the routes attribute on the controller class, now including the new route
  Reflect.defineProperty(target.constructor, "routes", { value: routes });
};
// Define a decorator and export it for each of the supported HttpMethods
export const Get = defineRouteDecorator(EHttpMethod.GET);
export const Put = defineRouteDecorator(EHttpMethod.PUT);
export const Post = defineRouteDecorator(EHttpMethod.POST);
export const Patch = defineRouteDecorator(EHttpMethod.PATCH);
export const Delete = defineRouteDecorator(EHttpMethod.DELETE);
