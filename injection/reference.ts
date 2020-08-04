import { Reflect } from "./reflect-poly.ts";

class DinosaurService {
  public numDinos = 3;
  public incrementDinos() {
    return ++this.numDinos;
  }
}

class AnotherService {
  public someValue = 4;
}

@Controller
class DinosaurController {
  constructor(private dinosaurService: DinosaurService, private anotherService: AnotherService) {}

  public incrementDinos() {
    return this.dinosaurService.incrementDinos();
  }
  public getSomeValue() {
    return this.anotherService.someValue;
  }
}

function Controller(target: any) {
  // NOTE getMetadata for predefined types, use defineProperty and get for postdefined types
  const types = Reflect.getMetadata("design:paramtypes", target) || [];
  console.log("Types from controller dec", types);
  // map the controllers constructor argument type names into it's metadata
  Reflect.defineMetadata(
    "constructor_types",
    types.map((t: any) => t.name),
    target
  );
  console.log("Assigned to controller metadata", Reflect.getMetadata("constructor_types", target));
}

class App {
  private controllers: Array<any>;
  private injectables: Array<any>;

  private dependencyContainer: Map<string, any>;

  public constructor(props: { controllers: Array<any>; injectables: Array<any> }) {
    this.controllers = props.controllers;
    this.injectables = props.injectables;
    this.dependencyContainer = new Map<string, any>();
  }

  public registerInjectables() {
    for (const Injectable of this.injectables) {
      // Singleton only here. all dependencies are instanciated at runtime.
      // will need to provide short lived instances in container in
      // future
      // What if they pass a static value too? How do we figure out if this
      // is a Newable or not?
      this.dependencyContainer.set(Injectable.name, new Injectable());
    }
  }

  public testResolve() {
    const dinoControllerDefinition = this.controllers[0];
    // resolve dependency from controller metadata to container
    // GET THIS FROM THE DEFINITION, NOT THE INSTANCE
    const constructorTypes = Reflect.getMetadata("constructor_types", dinoControllerDefinition);
    console.log("constructor_types @ resolution", constructorTypes);
    const singletons = constructorTypes.map((type: string) => this.dependencyContainer.get(type));
    console.log(
      "resolved singletons from container using controller types on metadata",
      singletons
    );
    // pass the singleton instance of the service to the controller
    const controllerInstance = new dinoControllerDefinition(...singletons);

    // see if it works hehe
    console.log(controllerInstance.incrementDinos());
  }
}

const app: App = new App({
  controllers: [DinosaurController],
  injectables: [DinosaurService, AnotherService],
});

app.registerInjectables();
app.testResolve();
app.testResolve();
app.testResolve();
