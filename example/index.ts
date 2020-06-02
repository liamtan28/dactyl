// Copyright 2020 Liam Tan. All rights reserved. MIT license.

import { Application } from "./deps.ts";

import DinosaurController from "./DinosaurController.ts";

const app: Application = new Application({
  controllers: [DinosaurController],
  config: {
    log: false,
    cors: true,
    timing: false,
  }
});
const PORT = 8000;

await app.run(PORT);
