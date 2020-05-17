export const HttpStatus = (code: number): any => (
  target: any,
  propertyKey: string
): void => {
  if (!Reflect.has(target.constructor, "response_status_codes")) {
    Reflect.defineProperty(target.constructor, "response_status_codes", {
      value: new Map<string, number>(),
    });
  }
  const statusCodes: Map<string, number> = Reflect.get(
    target.constructor,
    "response_status_codes"
  );
  statusCodes.set(propertyKey, code);
  Reflect.defineProperty(target.constructor, "response_status_codes", {
    value: statusCodes,
  });
};
