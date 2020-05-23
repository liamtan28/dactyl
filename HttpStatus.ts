import { ensureController, getMeta, setMeta } from "./metadata.ts";
import { ControllerMetadata } from "./model.ts";

export const HttpStatus = (code: number): any =>
  (
    target: any,
    propertyKey: string,
  ): void => {
    ensureController(target.constructor);

    const meta: ControllerMetadata = getMeta(
      target.constructor,
      "controllerMetadata",
    );
    meta.defaultResponseCodes.set(propertyKey, code);
    setMeta(target.constructor, "controllerMetadata", meta);
  };
