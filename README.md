# Dactyl

### Web framework for Deno, built on top of Oak

## TL:DR; Available modules:

Currently, through `mod.ts`, you have access to:

1. `Controller` - function decorator responsible for assigning controller metadata
2. `Application` - application class able to register controllers, and start the webserver
3. `HttpException` - throwable exception inside controller actions, `DactylRouter` will then handle said errors at top level and send the appropriate HTTP status code and message.
4. `HttpStatus` - function decorator responsible for assigning default status codes for controller actions
5. `Get, Post, Put, Patch, Delete` - currently supported function decorators responsible for defining routes on controller actions
6. `Param` - maps `context.params` onto argument in controller action
7. `Body` - maps `context.request` async body onto argument in controller action
8. `Query` - maps `context.url.searchParams` onto argument in controller action
9. `Header` - maps `context.headers` onto argument in controller action
10. `Context` - return whole Oak `RouterContext` object
11. `Request` - return whole Oak `Request` object
12. `Response` - return whole Oak `Response` object

## Purpose

Deno is the new kid on the block, and Oak seems to be paving the way for an express-like middleware and routing solution with our fancy new runtime. It's only natural that abstractions on top of Oak are born in the near future - much like Nest tucked express middleware and routing under the hood and provided developers with declarative controllers, DI, etc. This project aims to provide a small portion of these features with room to expand in future.

## Getting started

This repo contains an example project with one controller. You can execute this on your machine easily with Deno:

`deno run --allow-net --config=tsconfig.json https://raw.githubusercontent.com/liamtan28/dactyl/master/example/index.ts`

One caveat is to ensure you have a `tsconfig.json` file enabling `Reflect` and function decorators for this project, as Deno does not support this in it's default config. Ensure a `tsconfig.json` exists in your directory with at minimum:

```
{
  "compilerOptions":  {
	"experimentalDecorators":  true,
	"emitDecoratorMetadata":  true
  }
}
```

This should result in the following output:

```
Dactyl Framework - Authored by Liam Tan 2020
Building routes...
Routing structure below:

  /dinosaur
     [GET] /
     [GET] /:id
     [POST] /
     [PUT] /:id

Dactyl Example bootstrapped - please visit http://localhost:8000/
```

You can now visit your API.

## Dactyl in action

In the above example project, there exists one `Controller` and a bootstrapping file, `index.ts` that starts the web server.

`DinosaurController.ts`
Controllers are declared with function decorators. This stores metadata that is consumed on bootstrap and converted into route definitions that Oak can understand.

```
import {
  // ...
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
  getDinosaurById(@Param('id') id: any, @Header('content-type') contentType: any) {
    return {
      message: `Action returning one dinosaur with id ${id}`,
      ContentType: contentType,
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
  async updateDinosaur(@Param('id') id: any, @Body('name') name: any) {
    return {
      message: `Updated name of dinosaur with id ${id} to ${name}`,
    };
  }
}

export default DinosaurController;
```

`index.ts`
This file bootstraps the web server by registering `DinosaurController` to the `Application` instance. `Application` can then use the `.run()` async method to start the webserver.

```
import { Application } from "./deps.ts";

import DinosaurController from "./DinosaurController.ts";

const app: Application = new Application({
  controllers: [DinosaurController],
});

await app.run(8000);

```

And away we go. This spins up a web server using oak with the appropriately registered routes based on your controller definitions.

## Modules

All modules are accessible without the example project by referring to them in your `deps.ts` file.
E.g.

```
// deps.ts
export {
  Controller,
  DactylRouter,
  Get,
} from "https://raw.githubusercontent.com/liamtan28/dactyl/master/mod.ts";
```

**In the works**

1. `@Injectable` - DI implementation for controllers, allowing injectible services
2. `@Before, @BeforeAll` - decorators for controller and controller actions for pre-request actions like validation
3. CLI tool for boilerplate generation and file structure
4. Website with docos.
