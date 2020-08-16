import { Reflect } from "./reflect-poly.ts";
import { EInjectionScope, Newable, RequestLifetime } from "../types.ts";
import { DependencyContainer } from "./DependencyContainer.ts";
import { v4 } from "../deps.ts";

export const INJECTION_SCOPE_META_TOKEN: Symbol = Symbol("dactyl:injection_scope");
export const INJECTION_ID_META_TOKEN: Symbol = Symbol("dactyl:consumer_id");
export const CONSTRUCTOR_TYPE_META_TOKEN: string = "design:paramtypes";

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

/*

D(S) E(R) C(T)
  \   /    |
  A(T)    B(T)  C(T)
  \      /      /
   RootService(T)

*/

@Injectable(EInjectionScope.REQUEST)
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

@Injectable(EInjectionScope.TRANSIENT)
class C {
  get val() {
    return "C";
  }
}

@Injectable(EInjectionScope.TRANSIENT)
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

@Injectable(EInjectionScope.TRANSIENT)
class RootService {
  constructor(private a: A, private b: B, private c: C) {}
  get val() {
    return "RootService";
  }
  get A() {
    return this.a;
  }
  get C() {
    return this.c;
  }
  get B() {
    return this.b;
  }
}

@Injectable(EInjectionScope.SINGLETON)
class SingletonService {
  constructor(private d: D) {}
  get D() {
    return this.d;
  }
}

// END USER CODE

// Register injectables here
const container: DependencyContainer = new DependencyContainer();

// Boring Reflection stuff here.
const newables: Array<Newable<any>> = [/*SingletonService,*/ RootService, A, B, C, D, E];
for (const newable of newables) {
  const scope: EInjectionScope = Reflect.getMetadata(INJECTION_SCOPE_META_TOKEN, newable);
  container.register(newable, scope, newable.name);
}
//container.instantiateAllSingletons();

/**
 * FROM AUTOFAC DOCS
 *
 * It is recommended you always resolve components from a
 * lifetime scope where possible to make sure service
 * instances are properly disposed and garbage
 * collected.
 *
 */

const lifetime: RequestLifetime = container.newRequestLifetime();
const root: RootService = lifetime.resolve("RootService"); // will succeed.
console.log(root.A.D.val);
const root2: RootService = lifetime.resolve("RootService");
console.log(root2.A.E.val);
