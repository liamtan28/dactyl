# Dactyl

### Web framework for Deno, built on top of Oak

**Note** This project is currently a proof of concept. If I decide to actively maintain this, expect concepts to change.

## Purpose

Deno is the new kid on the block, and Oak seems to be pathing the way for an express-like middleware and routing solution with our fancy new runtime. It's only natural that abstractions on top of Oak are born in the near future - much like Nest tucked express middleware and routing under the hood and provided developers with declarative controllers, DI, etc. This project aims to provide a small portion of these features with room to expand in future.

Currently supported features are:

1. Declarative routing via controllers and function decorators
2. Exception filters (sort of)

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

Dactyl Example bootstrapped - please visit http://localhost:8000/
```

You can now visit your API.

## Dactyl in action

In the above example project, there exists one `Controller` and a bootstrapping file, `index.ts` that starts the web server.

`DinosaurController.ts`
Controllers are declared with function decorators. This stores metadata that is consumed on bootstrap and converted into route definitions that Oak can understand.

```
import {
  Controller,
  Get,
  Post,
  HttpStatus,
  HttpException,
  RouterContext,
} from "./deps.ts";

@Controller("/dinosaur")
class DinosaurController  {

  @Get("/")
  @HttpStatus(200)
  getDinosaurs()  {
    return  {
      message: "Action returning all dinosaurs! Defaults to 200 status!",
    };
  }

  @Get("/:id")
  getDinosaurById(context: RouterContext)  {
    return {
      message: `Action returning one dinosaur with id ${context.params.id}`,
    };
  }

  @Post("/")
  async createDinosaur(context:  RouterContext)  {
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
export  default DinosaurController;
```

`index.ts`
This file bootstraps the web server by registering `DinosaurController` to the `DactylRouter`. `DactylRouter` can then use the `.middleware()` method to convert the entire router into middleware that Oak understands.

```
import  { Application, DactylRouter }  from  "./deps.ts";
import DinosaurController from  "./DinosaurController.ts";

// Oak application
const app = new Application();

const router: DactylRouter = new DactylRouter();
router.register(DinosaurController);

// Register routes against Oak application
app.use(router.middleware());

const PORT = 8000;
console.info(
  `Dactyl Example bootstrapped - please visit http://localhost:${PORT}/`,
);
await app.listen({ port: 8000 });
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

Currently, through `mod.ts`, you have access to:

1. `Controller` - function decorator responsible for assigning controller metadata
2. `DactylRouter` - router class able to register controllers, and convert them into routes for oak to interpret
3. `HttpException` - throwable exception inside controller actions, `DactylRouter` will then handle said errors at top level and send the appropriate HTTP status code and message.
4. `HttpStatus` - function decorator responsible for assigning default status codes for controller actions
5. `Get, Post, Put, Patch, Delete` - currently supported function decorators responsible for defining routes on controller actions
