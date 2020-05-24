import {
  ensureController,
  getMeta,
  setMeta,
  CONTROLLER_META_PROPKEY,
} from "./metadata.ts";
import { ControllerMetadata } from "./types.ts";

export const HttpStatus = (code: number): any => (
  target: any,
  propertyKey: string
): void => {
  ensureController(target.constructor);

  const meta: ControllerMetadata = getMeta(
    target.constructor,
    CONTROLLER_META_PROPKEY
  );
  meta.defaultResponseCodes.set(propertyKey, code);
  setMeta(target.constructor, CONTROLLER_META_PROPKEY, meta);
};
