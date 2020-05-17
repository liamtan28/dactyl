import { Application, DactylRouter } from "./deps.ts";

import DinosaurController from "./DinosaurController.ts";

const app = new Application();

const router: DactylRouter = new DactylRouter();
router.register(DinosaurController);

app.use(router.middleware());
const PORT = 8000;
console.info(
  `Dactyl Example bootstrapped - please visit http://localhost:${PORT}/`,
);
await app.listen({ port: 8000 });
