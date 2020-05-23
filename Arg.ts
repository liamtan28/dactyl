import {
  EArgsType,
  ControllerMetadata,
  RouteDefinition,
} from "./model.ts";
import { ensureController, getMeta, setMeta } from "./metadata.ts";

const defineArgumentDecorator = (argType: EArgsType) =>
  (paramKey: string): any =>
    (
      target: any,
      propertyKey: string,
      parameterIndex: number,
    ): void => {
      // You can't ensure order of function decorators,
      // so ensure constructor has boilerplate metadata
      // before execution.
      ensureController(target.constructor);

      const meta: ControllerMetadata = getMeta(
        target.constructor,
        "controllerMetadata",
      );

      meta.args.push({
        type: argType,
        key: paramKey,
        index: parameterIndex,
        argFor: propertyKey,
      });
      setMeta(target.constructor, "controllerMetaData", meta);
    };

export const Param = defineArgumentDecorator(EArgsType.PARAM);
export const Body = defineArgumentDecorator(EArgsType.BODY);
export const Query = defineArgumentDecorator(EArgsType.QUERY);
export const Header = defineArgumentDecorator(EArgsType.HEADER);
