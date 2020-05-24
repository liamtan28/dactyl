import { Application } from "./deps.ts";

import DinosaurController from "./DinosaurController.ts";

const app: Application = new Application({
  controllers: [DinosaurController],
});

const PORT = 8000;
console.info(
  `Dactyl Example bootstrapped - please visit http://localhost:${PORT}/`
);

await app.run(PORT);
