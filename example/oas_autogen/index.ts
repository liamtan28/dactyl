// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Application, OasAutogenBuilder } from "../deps.ts";

import DinosaurController from "../DinosaurController.ts";

const app: Application = new Application({
  controllers: [DinosaurController],
});
//Deno.exit(0);
new OasAutogenBuilder(app)
  .addApplicationVersion("0.0.1")
  .addTitle("Dactyl example with dinosaur controller and routes")
  .addDesc(
    "Dactyl framework allows declarative controllers with TypeScript decorators",
  )
  .build("mypath");
