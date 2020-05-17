import {
  Controller,
  Get,
  Post,
  HttpStatus,
  HttpException,
  RouterContext,
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
  getDinosaurById(context: RouterContext) {
    return {
      message: `Action returning one dinosaur with id ${context.params.id}`,
    };
  }
  @Post("/")
  async createDinosaur(context: RouterContext) {
    // Access to Deno request object directly!
    if (!context.request.hasBody) {
      throw new HttpException("Bad Request", 400);
    }
    const result: any = await context.request.body();
    const { name } = result.value;

    if (!name) {
      throw new HttpException("name is a required field", 400);
    }
    return {
      message: `Created dinosaur with name ${name}`,
    };
  }
}

export default DinosaurController;
