import {
  Controller,
  Get,
  Post,
  Put,
  Params,
  Body,
  HttpStatus,
  HttpException,
} from "./deps.ts";
@Controller("/dinosaur")
class DinosaurController {
  @Get("/")
  @HttpStatus(200)
  getDinosaurs() {
    return {
      message: "Action returning all dinosaurs! Defaults to 200 status!",
    };
  }
  @Get("/:id")
  getDinosaurById(@Params('id') id: any) {
    return {
      message: `Action returning one dinosaur with id ${id}`,
    };
  }
  @Post("/")
  async createDinosaur(@Body('name') name: any) {
    if (!name) {
      throw new HttpException("name is a required field", 400);
    }
    return {
      message: `Created dinosaur with name ${name}`,
    };
  }
  @Put("/:id")
  async updateDinosaur(@Params('id') id: any, @Body('name') name: any) {
    return {
      message: `Updated name of dinosaur with id ${id} to ${name}`,
    };
  }
}

export default DinosaurController;
