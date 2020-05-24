import { ControllerMetadata, RouteDefinition } from "./types.ts";
import { setMetaIfNotDefined, getMeta, setMeta } from "./metadata.ts";
/**
 * Controller Class decorator responsible for initialising metadata on the controller class.
 * Defines the prefix to route all subsequent paths declared on the controller methods
 */
export function Controller = (prefix: string = ""): ClassDecorator => {
  return (target: any) => {
    setMetaIfNotDefined(target, "controllerMetadata", {
      prefix,
      routes: new Map<string, RouteDefinition>(),
    });
    // TODO investigate better impl here.
    // Essentially, sometimes the function decorators for methods
    // and args can trigger first before the Controller decorator
    // so because of this, the prefix needs to be updated
    const meta: ControllerMetadata = getMeta(target, "controllerMetadata");
    meta.prefix = prefix;
    setMeta(target, "controllerMetadata", meta);
  };
};
