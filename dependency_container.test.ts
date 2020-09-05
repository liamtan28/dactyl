import { assertEquals, assertThrows, assertStrictEquals } from "./deps.ts";

import DIContainerSingleton, { DependencyContainer } from "./dependency_container.ts";
import { Injectable } from "./injection.ts";
import { EInjectionScope, RequestLifetime } from "./types.ts";

function getNewContainer(): DependencyContainer {
  return new DependencyContainer();
}

Deno.test({
  name: "DIContainer to be exported as a singleton",
  fn() {
    assertEquals(DIContainerSingleton instanceof DependencyContainer, true);
  },
});

Deno.test({
  name: "A registered singleton class should be resolvable from container",
  fn() {
    class TestService {}

    const serviceIdent: string = TestService.name;
    const container: DependencyContainer = getNewContainer();

    container.register(TestService, EInjectionScope.SINGLETON, serviceIdent);

    const resolvedDep: TestService = container.resolve<TestService>(serviceIdent) ?? {};

    assertEquals(resolvedDep instanceof TestService, true);
  },
});

Deno.test({
  name: "A request scoped service cannot be resolved from container directly",
  fn() {
    class TestService {}

    const container: DependencyContainer = getNewContainer();
    const serviceIdent: string = TestService.name;

    container.register(TestService, EInjectionScope.REQUEST, serviceIdent);

    assertThrows(() => {
      container.resolve<TestService>(serviceIdent);
    });
  },
});

Deno.test({
  name: "A request scoped service can be resolved from a request lifetime",
  fn() {
    class TestService {}

    const serviceIdent: string = TestService.name;
    const container: DependencyContainer = getNewContainer();

    container.register(TestService, EInjectionScope.REQUEST, serviceIdent);

    const lifetime: RequestLifetime = container.newRequestLifetime();
    const resolvedDep: TestService = lifetime.resolve(serviceIdent) ?? {};

    assertEquals(resolvedDep instanceof TestService, true);
  },
});
Deno.test({
  name: "A resolved singleton dependency should always return the same instance",
  fn() {
    class TestService {}

    const container: DependencyContainer = getNewContainer();
    const serviceIdent: string = TestService.name;

    container.register(TestService, EInjectionScope.SINGLETON, serviceIdent);

    const instance1: TestService = container.resolve<TestService>(serviceIdent) ?? {};
    const instance2: TestService = container.resolve<TestService>(serviceIdent) ?? {};

    assertStrictEquals(instance1, instance2);
  },
});

Deno.test({
  name:
    "A resolved request scoped dependency from the same lifetime should return the same instance",
  fn() {
    class TestService {}

    const container: DependencyContainer = getNewContainer();
    const serviceIdent: string = TestService.name;

    container.register(TestService, EInjectionScope.REQUEST, serviceIdent);

    const lifetime: RequestLifetime = container.newRequestLifetime();

    const instance1: TestService = lifetime.resolve(serviceIdent) ?? {};
    const instance2: TestService = lifetime.resolve(serviceIdent) ?? {};

    assertStrictEquals(instance1, instance2);
  },
});
Deno.test({
  name:
    "A resolved request scope dependency from two different lifetimes should return different instances",
  fn() {
    class TestService {}

    const container: DependencyContainer = getNewContainer();
    const serviceIdent: string = TestService.name;

    container.register(TestService, EInjectionScope.REQUEST, serviceIdent);

    const lifetime1: RequestLifetime = container.newRequestLifetime();
    const lifetime2: RequestLifetime = container.newRequestLifetime();

    const instance1: TestService = lifetime1.resolve(serviceIdent) ?? {};
    const instance2: TestService = lifetime2.resolve(serviceIdent) ?? {};

    assertEquals(instance1 !== instance2, true);
  },
});
Deno.test({
  name: "A resolved transient dependency should always return a new instance",
  fn() {
    class TestService {}

    const serviceIdent: string = TestService.name;
    const container: DependencyContainer = getNewContainer();

    container.register(TestService, EInjectionScope.TRANSIENT, serviceIdent);

    const instance1: TestService = container.resolve<TestService>(serviceIdent) ?? {};
    const instance2: TestService = container.resolve<TestService>(serviceIdent) ?? {};

    assertEquals(instance1 !== instance2, true);
  },
});

Deno.test({
  name: "A Singleton scoped dependency cannot depend on a Request scoped dependency",
  fn() {
    @Injectable(EInjectionScope.REQUEST)
    class B {}

    @Injectable(EInjectionScope.SINGLETON)
    class A {
      public constructor(private b: B) {}
    }

    const container: DependencyContainer = getNewContainer();

    container.register(A, EInjectionScope.SINGLETON, "A");
    container.register(B, EInjectionScope.REQUEST, "B");

    const lifetime: RequestLifetime = container.newRequestLifetime();
    assertThrows(() => {
      const a: A | null = lifetime.resolve("A");
    });
  },
});
Deno.test({
  name: "A singleton scoped dependency cannot depend on a transient scoped dependency",
  fn() {
    @Injectable(EInjectionScope.TRANSIENT)
    class B {}

    @Injectable(EInjectionScope.SINGLETON)
    class A {
      public constructor(private b: B) {}
    }

    const container: DependencyContainer = getNewContainer();

    container.register(A, EInjectionScope.SINGLETON, "A");
    container.register(B, EInjectionScope.TRANSIENT, "B");

    assertThrows(() => {
      const a: A | null = container.resolve<A>("A");
    });
  },
});
Deno.test({
  name: "A request scoped dependency cannot depend on a transient dependency",
  fn() {
    @Injectable(EInjectionScope.TRANSIENT)
    class B {}

    @Injectable(EInjectionScope.REQUEST)
    class A {
      public constructor(private b: B) {}
    }

    const container: DependencyContainer = getNewContainer();

    container.register(A, EInjectionScope.REQUEST, "A");
    container.register(B, EInjectionScope.TRANSIENT, "B");

    assertThrows(() => {
      const a: A | null = container.resolve<A>("A");
    });
  },
});

Deno.test({
  name: "A request scoped dependency can depend on a singleton dependency",
  fn() {
    @Injectable(EInjectionScope.SINGLETON)
    class B {}

    @Injectable(EInjectionScope.REQUEST)
    class A {
      public constructor(private b: B) {}
      get B(): B {
        return this.b;
      }
    }

    const container: DependencyContainer = getNewContainer();

    container.register(A, EInjectionScope.REQUEST, "A");
    container.register(B, EInjectionScope.SINGLETON, "B");

    const lifetime: RequestLifetime = container.newRequestLifetime();

    const a: A = lifetime.resolve("A");
    assertEquals(a.B instanceof B, true);
  },
});

Deno.test({
  name: "A transient scoped dependency can depend on a singleton dependency",
  fn() {
    @Injectable(EInjectionScope.SINGLETON)
    class B {}

    @Injectable(EInjectionScope.TRANSIENT)
    class A {
      public constructor(private b: B) {}
      get B(): B {
        return this.b;
      }
    }

    const container: DependencyContainer = getNewContainer();

    container.register(A, EInjectionScope.TRANSIENT, "A");
    container.register(B, EInjectionScope.SINGLETON, "B");

    const lifetime: RequestLifetime = container.newRequestLifetime();

    const a: A = lifetime.resolve("A");
    assertEquals(a.B instanceof B, true);
  },
});

Deno.test({
  name: "A transient scoped dependency can depend on a request dependency",
  fn() {
    @Injectable(EInjectionScope.REQUEST)
    class B {}

    @Injectable(EInjectionScope.TRANSIENT)
    class A {
      public constructor(private b: B) {}
      get B(): B {
        return this.b;
      }
    }

    const container: DependencyContainer = getNewContainer();

    container.register(A, EInjectionScope.TRANSIENT, "A");
    container.register(B, EInjectionScope.REQUEST, "B");

    const lifetime: RequestLifetime = container.newRequestLifetime();

    const a: A = lifetime.resolve("A");
    assertEquals(a.B instanceof B, true);
  },
});

Deno.test({
  name: "The container should return null for an unregistered dependency",
  fn() {
    class A {}
    const container: DependencyContainer = getNewContainer();

    assertEquals(container.resolve<A>("A"), null);
  },
});
