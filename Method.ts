import { EHttpMethod, ControllerMetadata } from "./types.ts";
import { getControllerMeta, ensureController, setControllerMeta } from "./metadata.ts";
/**
 * Responsible for producing function decorators for all given HttpMethods.
 * Uses a curried function to return the function decorator.
 */
const defineRouteDecorator = (requestMethod: EHttpMethod) => (path: string): any => (
  target: any,
  propertyKey: string
): void => {
  // You can't ensure order of function decorators,
  // so ensure constructor has boilerplate metadata
  // before execution.
  ensureController(target.constructor);
  // Create a clone of the currently stored routes on the controller class, and push the new
  // value into it.
  const meta: ControllerMetadata = getControllerMeta(target.constructor);

  meta.routes.set(propertyKey, {
    requestMethod,
    path,
    methodName: propertyKey,
  });

  // Re-define the routes attribute on the controller class, now including the new route
  setControllerMeta(target.constructor, meta);
};
// Define a decorator and export it for each of the supported HttpMethods
export const Get = defineRouteDecorator(EHttpMethod.GET);
export const Put = defineRouteDecorator(EHttpMethod.PUT);
export const Post = defineRouteDecorator(EHttpMethod.POST);
export const Patch = defineRouteDecorator(EHttpMethod.PATCH);
export const Delete = defineRouteDecorator(EHttpMethod.DELETE);
