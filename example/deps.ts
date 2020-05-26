// Copyright 2020 Liam Tan. All rights reserved. MIT license.

// For your own project, deps.ts should re-export
// these deps from https://deno.land/x/dactyl/mod.ts
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
  BadRequestException,
  Application,
  Doc,
  OasAutogenBuilder,
} from "../mod.ts";

// Import this dependency if you wish to typecheck the result
// of @Context(), @Request, or @Response
export {
  RouterContext,
  Request as OakRequest,
  Response as OakResponse,
} from "https://deno.land/x/oak/mod.ts";
