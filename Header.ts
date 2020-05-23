import { ActionArgsDefinition, EArgsType } from "./model.ts";
export const Header = (headerKey: string): any =>
  (
    target: any,
    propertyKey: string,
    parameterIndex: number,
  ): void => {
    // set default if none exists
    if (!Reflect.has(target.constructor, "header")) {
      Reflect.defineProperty(target.constructor, "header", {
        value: new Map<string, ActionArgsDefinition[]>(),
      });
    }

    // Retreive whole map from Class metadata
    const headers: Map<string, ActionArgsDefinition[]> = Reflect.get(
      target.constructor,
      "header",
    );

    // retreive array of params corresponding to
    // controller action name
    const controllerActionHeaders: ActionArgsDefinition[] =
      headers.get(propertyKey) || [];

    // push new ParamsDefinition into the appropriate
    // controller action
    controllerActionHeaders.push({
      type: EArgsType.HEADER,
      key: headerKey,
      index: parameterIndex,
    });
    // set map value to new array, and then update
    // metadata value to new map
    headers.set(propertyKey, controllerActionHeaders);
    Reflect.defineProperty(target.constructor, "header", {
      value: headers,
    });
  };
