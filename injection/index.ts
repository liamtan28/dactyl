import { Reflect } from "./reflect-poly.ts";
import { EInjectionScope, Newable } from "../types.ts";
import { DependencyContainer } from "./DependencyContainer.ts";

const INJECTION_SCOPE_META_TOKEN: string = "injection_scope";
const CONSTRUCTOR_TYPE_META_TOKEN: string = "design:paramtypes";

function Controller(prefix: string) {
  return function (target: any): void {
    // This seems to be necessary to have metadata assigned to paramtypes?
  };
}

function Injectable(scope: EInjectionScope) {
  return function (target: any) {
    Reflect.defineMetadata(
      INJECTION_SCOPE_META_TOKEN,
      scope,
      target,
    );
  };
}

// USER CODE

@Injectable(EInjectionScope.SINGLETON)
class DinosaurService {
  public numDinos = 3;
  public incrementDinos() {
    return ++this.numDinos;
  }
}

@Injectable(EInjectionScope.REQUEST)
class AnotherService {
  public someValue = 4;
  public incrementSomeValue() {
    return ++this.someValue;
  }
}

@Controller("/")
class DinosaurController {
  constructor(
    private dinosaurService: DinosaurService,
    private anotherService: AnotherService,
  ) {}

  public incrementDinos() {
    return this.dinosaurService.incrementDinos();
  }
  public incrementSomeValue() {
    return this.anotherService.someValue;
  }
}

// END USER CODE

function registerInjectables(
  container: DependencyContainer,
  injectables: Array<Newable<any>>,
): void {
  for (const injectable of injectables) {
    const scope: EInjectionScope = Reflect.getMetadata(
      INJECTION_SCOPE_META_TOKEN,
      injectable,
    );
    // Check for key here
    container.register(injectable, scope, injectable.name);
  }
}

// Register injectables here
const container: DependencyContainer = new DependencyContainer();
const injectables: Array<Newable<any>> = [DinosaurService, AnotherService];
registerInjectables(container, injectables);

// resolve them here

function resolveDependencies(target: Newable<any>): Array<any> {
  const types: Array<string> = Reflect.getMetadata(
    CONSTRUCTOR_TYPE_META_TOKEN,
    target,
  ).map((type: Function) => type.name);

  const dependencies: Newable<any> | any = types.map((
    type: string,
  ): Newable<any> | any => container.resolve<Newable<any>>(type));

  return dependencies;
}

const controllerInstance = new DinosaurController(
  // @ts-ignore
  ...resolveDependencies(DinosaurController),
);

// test

// persist this as it's a singleton
console.log(controllerInstance.incrementDinos());
// this will not persist across consumers
console.log(controllerInstance.incrementSomeValue());
const anotherInstance = new DinosaurController(
  // @ts-ignore
  ...resolveDependencies(DinosaurController),
);
// should persist
console.log(anotherInstance.incrementDinos());
// should not persist
console.log(anotherInstance.incrementSomeValue());
