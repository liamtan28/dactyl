import { Newable, EInjectionScope, DependencyDefinition } from "../types.ts";

// TODO implement TRANSIENT at resoltion time.

/**
 * `DependencyContainer`, used to register and resolve injected dependencies
 */
export class DependencyContainer {
  private dependencyMap: Map<string, DependencyDefinition>;

  private requestScopedDependencies: Map<string, any>;

  public constructor() {
    this.dependencyMap = new Map<string, DependencyDefinition>();
    this.requestScopedDependencies = new Map<string, any>();
  }
  /**
   * `register` function will register an instance inside the `DependencyContainer`.
   *  An optional key can be provided to specify the retrieval key when resolving
   *  using the `@Inject()` decorator, but this will default to use the implicit
   *  type name.
   */
  public register(
    injectable: Newable<any>,
    scope: EInjectionScope,
    key?: string,
  ) {
    const mapKey = key ?? injectable.name;

    const DependencyDefinition = injectable;

    this.dependencyMap.set(mapKey, {
      scope,
      instanceOrDefinition: scope === EInjectionScope.SINGLETON
        ? new DependencyDefinition()
        : DependencyDefinition,
    });
  }
  /**
   * Returns instance of supplied target with it's dependencies resolved
   * from container
   */
  public resolve<T>(key: string): T {
    // TODO need to use recursion here to resolve a tree of dependencies
    const resolvedDependency: any = this.dependencyMap.get(key);

    const DependencyDefinition = resolvedDependency.instanceOrDefinition;

    // In Request scoped deps, resolve either a new instance, or the existing
    // one.
    if (resolvedDependency.scope === EInjectionScope.REQUEST) {
      // If this dependency already exists, return this instance.
      if (this.requestScopedDependencies.has(key)) {
        return this.requestScopedDependencies.get(key);
      }
      // If not, create new instance and register, then return.
      const instance = new DependencyDefinition();
      this.requestScopedDependencies.set(key, instance);
      return instance;
    }

    // If singleton, resolve the instance created at register.
    return DependencyDefinition;
  }

  /**
   * Garbage collect function that will remove any dependencies
   * that are scoped as `EInjectionScope.REQUEST`
   */
  public clearInstancedDependencies() {
    this.requestScopedDependencies.clear();
    // Javascript now garbage collects as no references to instances
    // exist, except for controller
  }
}
