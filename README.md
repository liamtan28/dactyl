<img src="./media/fulllogo.jpg?raw=true" alt="dactyl" width="243" height="161"/>

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/dactyl/mod.ts)
![RunUnitTests](https://github.com/liamtan28/dactyl/workflows/RunUnitTests/badge.svg?branch=master)

### Web framework for Deno, built on top of Oak

## Currently in the works

1. Dependency injection (delivered and usable! Improvements in the works)
2. OpenAPI autogeneration of documentation
3. CLI for autogeneration of Dactyl components

## Available modules:

Currently, through `mod.ts`, you have access to (docs link on left):

1. [Controller.ts](https://doc.deno.land/https/deno.land/x/dactyl/Controller.ts) - function decorator responsible for assigning controller metadata
2. [Application.ts](https://doc.deno.land/https/deno.land/x/dactyl/Application.ts) - application class able to register controllers, and start the webserver
3. [HttpException](https://doc.deno.land/https/deno.land/x/dactyl/HttpException.ts) - throwable exception inside controller actions, `Application` will then handle said errors at top level and send the appropriate HTTP status code and message. There is also a list of included predefined `HttpException` classes, see below
4. [HttpStatus.ts](https://doc.deno.land/https/deno.land/x/dactyl/HttpStatus.ts) - function decorator responsible for assigning default status codes for controller actions
5. [Method.ts](https://doc.deno.land/https/deno.land/x/dactyl/Method.ts) - `@Get, @Post, @Put, @Patch, @Delete` function decorators responsible for defining routes on controller actions
6. [Before.ts](https://doc.deno.land/https/deno.land/x/dactyl/Before.ts) - `@Before` method decorator responsible for defining actions to execute before controller action does. Has access to arguments as follows: `@Before((body, params, query, headers, context) => console.log('do something!')`

_For following - [Arg.ts](https://doc.deno.land/https/deno.land/x/dactyl/Arg.ts)_

6. `@Param` decorator maps `context.params` onto argument in controller action (returns whole `params` object if no key specified)
7. `@Body` decorator maps `context.request` async body onto argument in controller action (returns whole `body` object if no key specified)
8. `@Query` - maps `context.url.searchParams` onto argument in controller action (returns whole `query` object if no key specified)
9. `@Header` - maps `context.headers` onto argument in controller action (returns whole `header` object if no key specified)
10. `@Context` - return whole Oak `RouterContext` object
11. `@Request` - return whole Oak `Request` object
12. `@Response` - return whole Oak `Response` object
13. `@Inject` - inject a dependency directly from DIContainer. specify key `@Inject("DinosaurService")`

14. [Router.ts](https://doc.deno.land/https/deno.land/x/dactyl/Router.ts) - It is recommended that you use the `Application` to bootstrap, but you can use the `Router`
    class directly. This is a superclass of Oak's router, and exposes additional methods for mapping `Controller` definitions onto routes.

_For following - [Injectable.ts](https://doc.deno.land/https/deno.land/x/dactyl/injectable.ts)_

15. `@Injectable` - tag a service as injectable. Supply a scope, e.g. `@Injectable(EInjectionScope.SINGLETON)`
16. `@AutoInject` - tag a controller to use auto-injection of constructor params.

## Purpose

Deno is the new kid on the block, and Oak seems to be paving the way for an express-like middleware and routing solution with our fancy new runtime. It's only natural that abstractions on top of Oak are born in the near future - much like Nest tucked express middleware and routing under the hood and provided developers with declarative controllers, DI, etc. This project aims to provide a small portion of these features with room to expand in future.

## Getting started

This repo contains an example project with one controller. You can execute this on your machine easily with Deno:

`deno run --allow-net --config=tsconfig.json https://deno.land/x/dactyl/example/index.ts`

One caveat is to ensure you have a `tsconfig.json` file enabling `Reflect` and function decorators for this project, as Deno does not support this in it's default config. Ensure a `tsconfig.json` exists in your directory with at minimum:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

This should result in the following output:

```
______           _         _
|  _  \         | |       | |
| | | |__ _  ___| |_ _   _| |
| | | / _` |/ __| __| | | | |
| |/ / (_| | (__| |_| |_| | |
|___/ \__,_|\___|\__|\__, |_| FRAMEWORK
                      __/ |
                      |___/

/dinosaur
  [GET] /
  [GET] /:id
  [POST] /
  [PUT] /:id
  [DELETE] /:id

Dactyl running - please visit http://localhost:8000/
```

You can now visit your API.

## Dactyl in action

In the above example project, there exists one `Controller` and a bootstrapping file, `index.ts` that starts the web server.

`DinosaurController.ts`
Controllers are declared with function decorators. This stores metadata that is consumed on bootstrap and converted into route definitions that Oak can understand.

```ts
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
```

`DinosaurService.ts`
Dactyl supports dependency injection, and injects services via the constructor of Controller (see above). Supplied in the example is a service with scope `SINGLETON`, although `TRANSIENT` and `REQUEST` scopes are also supported. You can read more about dependency injection below.

```ts
@Injectable(EInjectionScope.SINGLETON)
export default class DinosaurService {
  #dinosaurs: Array<any> = [
    { id: 0, name: "Tyrannosaurus Rex", period: "Maastrichtian" },
    { id: 1, name: "Velociraptor", period: "Cretaceous" },
    { id: 2, name: "Diplodocus", period: "Oxfordian" },
  ];

  getAll(): Array<any> {
    return this.#dinosaurs;
  }

  getById(id: string): any {
    return this.#dinosaurs[parseInt(id, 10)];
  }

  addDinosaur(name: string) {
    const newDinosaur: any = {
      id: ++this.#lastId,
      name,
      period: "Unknown",
    };
    this.#dinosaurs.push(newDinosaur);
    return newDinosaur;
  }
}
```

`index.ts`
This file bootstraps the web server by registering `DinosaurController` to the `Application` instance. `Application` can then use the `.run()` async method to start the webserver.

```ts
import { Application } from "./deps.ts";

import DinosaurController from "./DinosaurController.ts";
import DinosaurService from "./DinosaurService.ts";

const app: Application = new Application({
  controllers: [DinosaurController],
  injectables: [DinosaurService],
});

await app.run(8000);
```

And away we go. This spins up a web server using oak with the appropriately registered routes based on your controller definitions.

## Configuration

There is additional configuration that you can pass to the application upon bootstrap:

```ts
const app: Application = new Application({
  controllers: [DinosaurController],
  config: {
    cors: false, // true by default
    timing: false, // true by default
    log: false, // true by default
  },
});
```

1. `cors` - Enables CORS middleware (`true` by default). This sets the following headers to `*` on `context.response`: `access-control-allow-origin`, `access-control-allow-methods`, `access-control-allow-methods`.
2. `timing` - Enables timing header middleware (`true` by default). This sets `X-Response-Time` header on `context.response`.
3. `log` - Enables per-request logging (`true by default`). The message format is: `00:00:00 GMT+0000 (REGION) [GET] - /path/to/endpoint - [200 OK]`

## Dependency Injection

Dactyl uses it's own dependency injection container. You can even access the API for the container itself from the `dependency_container` file exported in `mod.ts`.
This container supports three scopes: `SINGLETON`, `REQUEST`, and `TRANSIENT`:

`SINGLETON` scoped dependencies are instantiated when the application starts up. When resolved from the container via autoinjection of constructor arguments, you will
always receive the same instance that's cached in the container. Use `SINGLETON` scope where possible.

`REQUEST` scoped dependencies are instantiated when a new request is received. When the request lifetime ends, the request dependency cache is dumped. If two concurrent
requests are received by the Dactyl server, both requests will receive their own instance, even if they require the same dependency.

`TRANSIENT` scoped dependencies are instantiated every time they are resolved, meaning every controller or service that consumes a `TRANSIENT` dependency will receive
it's own instance.

Currently, Dactyl supports autoinjection of dependencies in the constructor, and parameter injection. In order to do this, the following must be done:

1. Tag your service with the `Injectable` class decorator, with the scope you want:

```ts
@Injectable(EInjectionScope.TRANSIENT)
class DinosaurService {}
```

2. Consume your service in the desired controller. It will be resolved by the container based on it's type name. Be sure to tage the class with the `@AutoInject` decorator to auto inject constructor params.

```ts
@Controller("/dinosaur")
@AutoInject()
class DinosaurController {
  constructor(private dinosaurService: DinosaurService) {}
}
```

3. Supply your `Application` class with the injectable, so that it may register it inside the container:

```ts
const app: Application = new Application({
  controllers: [DinosaurController],
  injectables: [DinosaurService],
});
```

And you're all done! `DinosaurService` will be autoinjected into the constructor, with the `TRANSIENT` scope.

### A Note on Scopes

One common design trap for Dependency Injection is parent dependencies depending on services with a _smaller_ scope than their own. For example:
`Service A (Singleton) -> Service B (Request)`
Service A is only instantiated once, so how can it depend on a service that is instantiated every request? Some DI implementations will address this
by making any service that is required by a singleton also a singleton, however this effectively negates the uses for `TRANSIENT` and `REQUEST`.

Instead Dactyl will perform a task (at resolution) to ensure that children dependencies do not decrease in size of scope, ensuring that the three
scopes are being used properly. The scope size is as follows:
`Transient -> Request -> Singleton`.
And so the following is true:

```
Transient -> Request -> Singleton // will not throw error
Transient -> Transient // will not throw error
Request -> Request -> Singleton // will not throw error
Request -> Transient // will throw error
Singleton -> Request // will throw error
```

## Exceptions

Exceptions can be raised at any time in the request lifecycle. `HttpException` allows you to raise a custom exception, or you can
use a predefined `HttpException` (listed below):

1. `BadRequestException`
2. `UnauthorizedException`
3. `PaymentRequiredException`
4. `ForbiddenException`
5. `NotFoundException`
6. `MethodNotAllowedException`
7. `RequestTimeoutException`
8. `UnsupportedMediaTypeException`
9. `TeapotException`
10. `UnprocessableEntityException`
11. `TooManyRequestsException`
12. `RequestHeaderFieldsTooLargeException`
13. `InternalServerErrorException`
14. `NotImplementedException`
15. `BadGatewayException`
16. `ServiceUnavailableException`
17. `GatewayTimeoutException`

[HttpException.ts](https://doc.deno.land/https/deno.land/x/dactyl/HttpException.ts)

## Modules

All modules are accessible without the example project by referring to them in your `deps.ts` file.
E.g.

```ts
export { Controller, DactylRouter, Get } from "https://deno.land/x/dactyl/mod.ts";
```
