import { ActionArgsDefinition, EArgsType } from "./model.ts";
export const Body = (bodyKey: string): any =>
  (
    target: any,
    propertyKey: string,
    parameterIndex: number,
  ): void => {
    // set default if none exists
    if (!Reflect.has(target.constructor, "body")) {
      Reflect.defineProperty(target.constructor, "body", {
        value: new Map<string, ActionArgsDefinition[]>(),
      });
    }

    // Retreive whole map from Class metadata
    const body: Map<string, ActionArgsDefinition[]> = Reflect.get(
      target.constructor,
      "body",
    );

    // retreive array of body corresponding to
    // controller action name
    const controllerActionParams: ActionArgsDefinition[] =
      body.get(propertyKey) || [];

    // push new ActionArgsDefinition into the appropriate
    // controller action
    controllerActionParams.push({
      type: EArgsType.BODY,
      key: bodyKey,
      index: parameterIndex,
    });
    // set map value to new array, and then update
    // metadata value to new map
    body.set(propertyKey, controllerActionParams);
    Reflect.defineProperty(target.constructor, "pabodyams", {
      value: body,
    });
  };
