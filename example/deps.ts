// This in the example will come from my deno.land module, not locally
export {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Header,
  Context,
  Request,
  Response,
  HttpStatus,
  HttpException,
  Application,
} from "../mod.ts";
// Import this dependency if you wish to typecheck the result
// of @Context(), @Request, or @Response
export {
  RouterContext,
  Request as OakRequest,
  Response as OakResponse,
} from "https://deno.land/x/oak/mod.ts";
