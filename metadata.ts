import { ControllerMetadata, RouteDefinition } from "./types.ts";

export const CONTROLLER_META_PROPKEY = "dactyl_controller_metadata";

export const getMeta = (target: any, key: string) => {
  return Reflect.get(target, key);
};
export const setMeta = (target: any, key: string, value: any) => {
  Reflect.defineProperty(target, key, { value });
};
export const setMetaIfNotDefined = (
  target: any,
  key: string,
  value: any
): void => {
  if (!Reflect.has(target, key)) {
    setMeta(target, key, value);
  }
};
export const ensureController = (target: any) => {
  const meta: ControllerMetadata = {
    prefix: null,
    routes: new Map<string, RouteDefinition>(),
    args: [],
    defaultResponseCodes: new Map<string, number>(),
  };
  setMetaIfNotDefined(target, CONTROLLER_META_PROPKEY, meta);
};
