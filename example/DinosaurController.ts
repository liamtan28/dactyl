// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Header,
  Context,
  Request,
  Response,
  HttpStatus,
  BadRequestException,
  RouterContext,
  OakRequest,
  OakResponse,
} from "./deps.ts";

@Controller("/dinosaur")
class DinosaurController {
  @Get("/")
  @HttpStatus(200)
  getDinosaurs(@Query("orderBy") orderBy: any, @Query("sort") sort: any) {
    const dinosaurs: any[] = [
      { name: "Tyrannosaurus Rex", period: "Maastrichtian" },
      { name: "Velociraptor", period: "Cretaceous" },
      { name: "Diplodocus", period: "Oxfordian" },
    ];

    if (orderBy) {
      dinosaurs.sort((a: any, b: any) => (a[orderBy] < b[orderBy] ? -1 : 1));
      if (sort === "desc") dinosaurs.reverse();
    }

    return {
      message: "Action returning all dinosaurs! Defaults to 200 status!",
      data: dinosaurs,
    };
  }
  @Get("/:id")
  getDinosaurById(@Param("id") id: any, @Header("content-type") contentType: any) {
    return {
      message: `Action returning one dinosaur with id ${id}`,
      ContentType: contentType,
    };
  }
  @Post("/")
  createDinosaur(@Body("name") name: any) {
    if (!name) {
      throw new BadRequestException("name is a required field");
    }
    return {
      message: `Created dinosaur with name ${name}`,
    };
  }
  @Put("/:id")
  updateDinosaur(@Param("id") id: any, @Body("name") name: any) {
    return {
      message: `Updated name of dinosaur with id ${id} to ${name}`,
    };
  }
  @Delete("/:id")
  deleteDinosaur(
    @Context() ctx: RouterContext,
    @Request() req: OakRequest,
    @Response() res: OakResponse
  ) {
    return {
      message: `Deleted dinosaur with id ${ctx.params.id}`,
    };
  }
}

export default DinosaurController;
