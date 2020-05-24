import { EArgsType, ControllerMetadata, RouteDefinition } from "./types.ts";
import { ensureController, getMeta, setMeta } from "./metadata.ts";

const defineArgumentDecorator = (
  argType: EArgsType,
  paramKeyRequired: boolean
) => (paramKey?: string): any => (
  target: any,
  propertyKey: string,
  parameterIndex: number
): void => {
  if (paramKeyRequired && !paramKey) {
    throw new Error(
      `${propertyKey} decorated with ${argType} requires a paramter argument`
    );
  }

  // You can't ensure order of function decorators,
  // so ensure constructor has boilerplate metadata
  // before execution.
  ensureController(target.constructor);

  const meta: ControllerMetadata = getMeta(
    target.constructor,
    "controllerMetadata"
  );

  meta.args.push({
    type: argType,
    key: paramKey || "",
    index: parameterIndex,
    argFor: propertyKey,
  });
  setMeta(target.constructor, "controllerMetaData", meta);
};

export const Param = defineArgumentDecorator(EArgsType.PARAM, true);
export const Body = defineArgumentDecorator(EArgsType.BODY, true);
export const Query = defineArgumentDecorator(EArgsType.QUERY, true);
export const Header = defineArgumentDecorator(EArgsType.HEADER, true);

export const Context = defineArgumentDecorator(EArgsType.CONTEXT, false);
export const Request = defineArgumentDecorator(EArgsType.REQUEST, false);
export const Response = defineArgumentDecorator(EArgsType.RESPONSE, false);
