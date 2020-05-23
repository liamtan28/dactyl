import { ParamsDefinition } from "./model.ts";
export const Params = (bodyKey: string): any =>
  (
    target: any,
    propertyKey: string,
    parameterIndex: number,
  ): void => {
    // set default if none exists
    if (!Reflect.has(target.constructor, "params")) {
      Reflect.defineProperty(target.constructor, "params", {
        value: new Map<string, ParamsDefinition[]>(),
      });
    }

    // Retreive whole map from Class metadata
    const params: Map<string, ParamsDefinition[]> = Reflect.get(
      target.constructor,
      "params",
    );

    // retreive array of params corresponding to
    // controller action name
    const controllerActionParams: ParamsDefinition[] =
      params.get(propertyKey) || [];

    // push new ParamsDefinition into the appropriate
    // controller action
    controllerActionParams.push({
      key: bodyKey,
      index: parameterIndex,
    });
    // set map value to new array, and then update
    // metadata value to new map
    params.set(propertyKey, controllerActionParams);
    Reflect.defineProperty(target.constructor, "params", {
      value: params,
    });
  };
