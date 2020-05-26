import { DocDefinition, ControllerMetadata, OasPathObject } from "./types.ts";
import { getControllerMeta, setControllerMeta, defaultMetadata } from "./metadata.ts";

/**
 * Method decorator used to define docs for OpenAPI spec.
 * Most of OpenAPI path object definition can be inferred
 * from types, however if the user wants non-deterministic
 * fields such as "description" in their doc, they can use
 * the `@Doc` decorator in accordance with `OasPathObject`
 * to define these properties
 */
export function Doc(pathObject: OasPathObject): MethodDecorator {
  return (target: Object, propertyKey: string | Symbol) => {
    const meta: ControllerMetadata = getControllerMeta(target) ?? defaultMetadata();
    const docDef: DocDefinition = {
      docFor: propertyKey,
      model: {
        description: propertyKey as string, // set default desc here as controller action
        ...pathObject,
      },
    };
    meta.docs.push(docDef);
    setControllerMeta(target, meta);
  };
}
