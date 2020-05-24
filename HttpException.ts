// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Status, STATUS_TEXT } from "./deps.ts";
/**
 * General purpose HttpException export class, can be raised at
 * any stage of the request lifecycle, resulting in oak
 * appropriately handling the error. Expected JSON
 * payload is:
 *
 * ```json
 * {
 *   "error": "HttpException.error",
 *   "status": "HttpException.status"
 * }
 * ```
 *
 */
export class HttpException {
  private status: Status;
  private error: string | undefined;
  public constructor(status: Status, error: string | undefined) {
    this.error = error;
    this.status = status;
  }
  public getError(): { error: string | undefined; status: Status } {
    const { error, status } = this;
    return {
      error,
      status,
    };
  }
}
export class BadRequestException extends HttpException {
  public constructor(msg?: string) {
    super(Status.BadRequest, msg || STATUS_TEXT.get(Status.BadRequest));
  }
}
export class UnauthorizedException extends HttpException {
  public constructor(msg?: string) {
    super(Status.Unauthorized, msg || STATUS_TEXT.get(Status.Unauthorized));
  }
}
export class PaymentRequiredException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.PaymentRequired,
      msg || STATUS_TEXT.get(Status.PaymentRequired)
    );
  }
}
export class ForbiddenException extends HttpException {
  public constructor(msg?: string) {
    super(Status.Forbidden, msg || STATUS_TEXT.get(Status.Forbidden));
  }
}
export class NotFoundException extends HttpException {
  public constructor(msg?: string) {
    super(Status.NotFound, msg || STATUS_TEXT.get(Status.NotFound));
  }
}
export class MethodNotAllowedException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.MethodNotAllowed,
      msg || STATUS_TEXT.get(Status.MethodNotAllowed)
    );
  }
}
export class RequestTimeoutException extends HttpException {
  public constructor(msg?: string) {
    super(Status.RequestTimeout, msg || STATUS_TEXT.get(Status.RequestTimeout));
  }
}
export class UnsupportedMediaTypeException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.UnsupportedMediaType,
      msg || STATUS_TEXT.get(Status.UnsupportedMediaType)
    );
  }
}
export class TeapotException extends HttpException {
  public constructor(msg?: string) {
    super(Status.Teapot, msg || STATUS_TEXT.get(Status.Teapot));
  }
}
export class UnprocessableEntityException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.UnprocessableEntity,
      msg || STATUS_TEXT.get(Status.UnprocessableEntity)
    );
  }
}
export class TooManyRequestsException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.TooManyRequests,
      msg || STATUS_TEXT.get(Status.TooManyRequests)
    );
  }
}
export class RequestHeaderFieldsTooLargeException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.RequestHeaderFieldsTooLarge,
      msg || STATUS_TEXT.get(Status.RequestHeaderFieldsTooLarge)
    );
  }
}
export class InternalServerErrorException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.InternalServerError,
      msg || STATUS_TEXT.get(Status.InternalServerError)
    );
  }
}
export class NotImplementedException extends HttpException {
  public constructor(msg?: string) {
    super(Status.NotImplemented, msg || STATUS_TEXT.get(Status.NotImplemented));
  }
}
export class BadGatewayException extends HttpException {
  public constructor(msg?: string) {
    super(Status.BadGateway, msg || STATUS_TEXT.get(Status.BadGateway));
  }
}
export class ServiceUnavailableException extends HttpException {
  public constructor(msg?: string) {
    super(
      Status.ServiceUnavailable,
      msg || STATUS_TEXT.get(Status.ServiceUnavailable)
    );
  }
}
export class GatewayTimeoutException extends HttpException {
  public constructor(msg?: string) {
    super(Status.GatewayTimeout, msg || STATUS_TEXT.get(Status.GatewayTimeout));
  }
}
