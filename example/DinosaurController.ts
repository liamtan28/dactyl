import {
  Controller,
  Get,
  Post,
  Put,
  Params,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from "./deps.ts";

@Controller("/dinosaur")
class DinosaurController {
  @Get("/")
  @HttpStatus(200)
  getDinosaurs(@Query('orderBy') orderBy: any, @Query('sort') sort: any) {

    const dinosaurs: any[] = [
      { name: 'Tyrannosaurus Rex', period: 'Maastrichtian'},
      { name: 'Velociraptor', period: 'Cretaceous' },
      { name: 'Diplodocus', period: 'Oxfordian' }
    ];
    
    if(orderBy) {
      dinosaurs.sort((a: any, b: any) => a[orderBy] < b[orderBy] ? -1 : 1);
      if (sort === 'desc') dinosaurs.reverse();
    }

    return {
      message: "Action returning all dinosaurs! Defaults to 200 status!",
      data: dinosaurs,
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
