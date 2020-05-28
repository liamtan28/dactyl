import { STATUS_TEXT, Status, assertEquals } from "./deps.ts";
import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  PaymentRequiredException,
  ForbiddenException,
  NotFoundException,
  MethodNotAllowedException,
  RequestTimeoutException,
  UnsupportedMediaTypeException,
  TeapotException,
  UnprocessableEntityException,
  TooManyRequestsException,
  RequestHeaderFieldsTooLargeException,
  InternalServerErrorException,
  NotImplementedException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
} from "./HttpException.ts";
import { Newable } from "./types.ts";

Deno.test({
  name: "HttpException.getError returns object literal of correct shape",
  fn() {
    const testStatus: Status = Status.Teapot;
    const testMsg: string = "testMessage";
    const testException: HttpException = new HttpException(
      testStatus,
      testMsg,
    );
    assertEquals(
      testException.getError(),
      { error: testMsg, status: testStatus },
    );
  },
});
/**
 * Run tests for specific `HttpException` subclasses here.
 */

const testData: Array<{
  name: string;
  exception: Newable<HttpException>;
  status: Status;
}> = [
  {
    name: "BadRequestException",
    exception: BadRequestException,
    status: Status.BadRequest,
  },
  {
    name: "UnauthorizedException",
    exception: UnauthorizedException,
    status: Status.Unauthorized,
  },
  {
    name: "PaymentRequiredException",
    exception: PaymentRequiredException,
    status: Status.PaymentRequired,
  },
  {
    name: "ForbiddenException",
    exception: ForbiddenException,
    status: Status.Forbidden,
  },
  {
    name: "NotFoundException",
    exception: NotFoundException,
    status: Status.NotFound,
  },
  {
    name: "MethodNotAllowedException",
    exception: MethodNotAllowedException,
    status: Status.MethodNotAllowed,
  },
  {
    name: "RequestTimeoutException",
    exception: RequestTimeoutException,
    status: Status.RequestTimeout,
  },
  {
    name: "UnsupportedMediaTypeException",
    exception: UnsupportedMediaTypeException,
    status: Status.UnsupportedMediaType,
  },
  {
    name: "TeapotException",
    exception: TeapotException,
    status: Status.Teapot,
  },
  {
    name: "UnprocessableEntityException",
    exception: UnprocessableEntityException,
    status: Status.UnprocessableEntity,
  },
  {
    name: "TooManyRequestsException",
    exception: TooManyRequestsException,
    status: Status.TooManyRequests,
  },
  {
    name: "RequestHeaderFieldsTooLargeException",
    exception: RequestHeaderFieldsTooLargeException,
    status: Status.RequestHeaderFieldsTooLarge,
  },
  {
    name: "InternalServerErrorException",
    exception: InternalServerErrorException,
    status: Status.InternalServerError,
  },
  {
    name: "NotImplementedException",
    exception: NotImplementedException,
    status: Status.NotImplemented,
  },
  {
    name: "BadGatewayException",
    exception: BadGatewayException,
    status: Status.BadGateway,
  },
  {
    name: "ServiceUnavailableException",
    exception: ServiceUnavailableException,
    status: Status.ServiceUnavailable,
  },
  {
    name: "GatewayTimeoutException",
    exception: GatewayTimeoutException,
    status: Status.GatewayTimeout,
  },
];

for (const testDataItem of testData) {
  Deno.test({
    name:
      `${testDataItem.name} should return error with status ${testDataItem.status}`,
    fn() {
      const instance: HttpException = new testDataItem.exception();
      assertEquals(instance.getError(), {
        error: STATUS_TEXT.get(testDataItem.status),
        status: testDataItem.status,
      });
    },
  });
}
