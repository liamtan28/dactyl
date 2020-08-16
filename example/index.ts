// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Application } from "./deps.ts";

import DinosaurController from "./DinosaurController.ts";
import DinosaurService from "./DinosaurService.ts";

const app: Application = new Application({
  controllers: [DinosaurController],
  injectables: [DinosaurService],
});
const PORT = 8000;

await app.run(PORT);
