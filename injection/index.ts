import { Reflect } from "./reflect-poly.ts";
import { EInjectionScope, Newable, RequestLifetime } from "../types.ts";
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

@Injectable(EInjectionScope.SINGLETON)
class E {
  get val() {
    return "E";
  }
}

@Injectable(EInjectionScope.SINGLETON)
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

// Register injectables here
const container: DependencyContainer = new DependencyContainer();

// Boring Reflection stuff here.
const newables: Array<Newable<any>> = [SingletonService, RootService, A, B, C, D, E];
for (const newable of newables) {
  const scope: EInjectionScope = Reflect.getMetadata(INJECTION_SCOPE_META_TOKEN, newable);
  container.register(newable, scope, newable.name);
}
container.instantiateAllSingletons();

// Should fail. It fails because RootService depends on
// request scoped providers, but you're calling this
// without a requestLifetime.
try {
  container.resolve("RootService");
} catch (e) {
  console.log("Caught error on resolution: ", e);
}
const lifetime: RequestLifetime = container.newRequestLifetime();
const root: RootService = lifetime.resolve("RootService"); // will succeed.
console.log(root.A.D.val);
