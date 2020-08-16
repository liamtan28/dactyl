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
  Before,
  Inject,
  AutoInject,
} from "./deps.ts";
import DinosaurService from "./DinosaurService.ts";

@Controller("/dinosaur")
@AutoInject()
class DinosaurController {
  constructor(private dinosaurService: DinosaurService) {}

  @Get("/")
  @HttpStatus(200)
  getDinosaurs(@Query("orderBy") orderBy: string) {
    const dinosaurs: Array<any> = this.dinosaurService.getAll();
    return {
      message: "Action returning all dinosaurs! Defaults to 200 status!",
      data: dinosaurs,
    };
  }

  @Get("/:id")
  getDinosaurById(@Param("id") id: string, @Header("content-type") contentType: string) {
    const dinosaur: any = this.dinosaurService.getById(id);
    return {
      dinosaur,
      ContentType: contentType,
    };
  }

  @Post("/")
  createDinosaur(
    @Body("name") name: any,
    @Inject("DinosaurService") dinosaurService: DinosaurService
  ) {
    if (!name) {
      throw new BadRequestException("name is a required field");
    }
    const newDinosaur: any = dinosaurService.addDinosaur(name);
    return {
      message: `Created dinosaur with name ${name}`,
      newDinosaur,
    };
  }

  @Put("/:id")
  @Before((body: any, params: any) => {
    if (!body.name || !params.id) {
      throw new BadRequestException("Caught bad request in decorator");
    }
  })
  @Before(
    async () =>
      await new Promise((resolve: Function) =>
        setTimeout((): void => {
          console.log("Can add async actions here too!");
          resolve();
        }, 2000)
      )
  )
  updateDinosaur(@Param("id") id: any, @Body() body: any) {
    return {
      message: `Updated name of dinosaur with id ${id} to ${body.name}`,
    };
  }

  @Delete("/:id")
  deleteDinosaur(
    @Context() ctx: RouterContext,
    @Request() req: OakRequest,
    @Response() res: OakResponse
  ) {
    res.status = 404;
    res.body = {
      msg: `No dinosaur found with id ${ctx.params.id}`,
    };
  }
}

export default DinosaurController;
