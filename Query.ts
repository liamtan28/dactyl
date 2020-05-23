import { ActionArgsDefinition, EArgsType } from "./model.ts";
export const Query = (queryKey: string): any =>
  (
    target: any,
    propertyKey: string,
    parameterIndex: number,
  ): void => {
    // set default if none exists
    if (!Reflect.has(target.constructor, "query")) {
      Reflect.defineProperty(target.constructor, "query", {
        value: new Map<string, ActionArgsDefinition[]>(),
      });
    }

    // Retreive whole map from Class metadata
    const query: Map<string, ActionArgsDefinition[]> = Reflect.get(
      target.constructor,
      "query",
    );

    // retreive array of params corresponding to
    // controller action name
    const controllerActionParams: ActionArgsDefinition[] =
      query.get(propertyKey) || [];

    // push new ParamsDefinition into the appropriate
    // controller action
    controllerActionParams.push({
      type: EArgsType.QUERY,
      key: queryKey,
      index: parameterIndex,
    });
    // set map value to new array, and then update
    // metadata value to new map
    query.set(propertyKey, controllerActionParams);
    Reflect.defineProperty(target.constructor, "query", {
      value: query,
    });
  };
