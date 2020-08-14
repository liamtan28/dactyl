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
    Reflect.defineMetadata(INJECTION_SCOPE_META_TOKEN, scope, target);
  };
}

// USER CODE

@Injectable(EInjectionScope.REQUEST)
class E {
  get val() {
    return "E";
  }
}

@Injectable(EInjectionScope.REQUEST)
class D {
  get val() {
    return "D";
  }
}

@Injectable(EInjectionScope.REQUEST)
class C {
  get val() {
    return "C";
  }
}

@Injectable(EInjectionScope.REQUEST)
class B {
  constructor(private c: C) {}
  get val() {
    return "B";
  }
  get C() {
    return this.c;
  }
}

@Injectable(EInjectionScope.REQUEST)
class A {
  constructor(private d: D, private e: E) {}
  get val() {
    return "A";
  }
  get D() {
    return this.d;
  }
  get E() {
    return this.e;
  }
}

@Injectable(EInjectionScope.REQUEST)
class RootService {
  constructor(private a: A, private b: B, private a2: A) {}
  get val() {
    return "RootService";
  }
  get A() {
    return this.a;
  }
  get A2() {
    return this.a2;
  }
  get B() {
    return this.b;
  }
}

@Injectable(EInjectionScope.SINGLETON)
class SingletonService {
  constructor(private e: E) {}
  get E() {
    return this.e;
  }
}

// END USER CODE

function registerInjectables(
  container: DependencyContainer,
  serviceDefinitions: Array<Newable<any>>
): void {
  for (const serviceDefinition of serviceDefinitions) {
    const scope: EInjectionScope = Reflect.getMetadata(
      INJECTION_SCOPE_META_TOKEN,
      serviceDefinition
    );
    // Check for key here
    // For now defaulting to use Newable name as key
    container.register(serviceDefinition, scope, serviceDefinition.name);
  }
}

// Register injectables here
const container: DependencyContainer = new DependencyContainer();
const injectables: Array<Newable<any>> = [SingletonService, RootService, A, B, C, D, E];
registerInjectables(container, injectables);

container.instanciateAllSingletons();

// resolve them here

const root: RootService | null = container.resolve<RootService>("RootService");
if (root === null) throw new Error("NULL");
console.log(root.val);
console.log(root.A.val);
console.log(root.A2.val);
console.log(root.A === root.A2);
console.log(root.B.val);
console.log(root.A.D.val);
console.log(root.A.E.val);
console.log(root.B.C.val);
// container.clearRequestDependencies();
const singleton: SingletonService | null = container.resolve<SingletonService>("SingletonService");
console.log(singleton);
console.log(singleton?.E === root.A.E);
