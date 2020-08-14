import { Newable, EInjectionScope, DependencyDefinition } from "../types.ts";

const CONSTRUCTOR_TYPE_META_TOKEN: string = "design:paramtypes";
import { Reflect } from "./reflect-poly.ts";
// TODO implement TRANSIENT at resoltion time.

/**
 * `DependencyContainer`, used to register and resolve injected dependencies
 */
export class DependencyContainer {
  /** Definitions (pre-instanciated) */
  #serviceDefinitions: Map<string, DependencyDefinition>;
  /** Cached instances of dependencies */
  #depsSingleton: Map<string, any>;
  #depsTransient: Map<string, any>;
  #depsRequest: Map<string, any>;

  constructor() {
    this.#serviceDefinitions = new Map<string, DependencyDefinition>();
    this.#depsSingleton = new Map<string, any>();
    this.#depsTransient = new Map<string, any>();
    this.#depsRequest = new Map<string, any>();
  }
  /**
   * `register` function will register an instance inside the `DependencyContainer`.
   *  An optional key can be provided to specify the retrieval key when resolving
   *  using the `@Inject()` decorator, but this will default to use the implicit
   *  type name.
   */
  register(serviceDefinition: Newable<any>, scope: EInjectionScope, key: string) {
    this.#serviceDefinitions.set(key, {
      scope,
      serviceDefinition,
    });
  }

  resolve<T>(key: string): T | null {
    console.log("=====[BEGIN RESOLUTION]=====");
    const resolutionQueue: Array<any> = [];
    const rootServiceDefinition: DependencyDefinition | undefined = this.#serviceDefinitions.get(
      key
    );

    let ptr = 0;

    // a root service definition wasn't cached. It's deps could be either
    // cached or not cached, so:

    // prefer cached version. If no cached, create new instance and cache it.
    const _processQueue = (): any => {
      let dep: DependencyDefinition;
      let instance: any;
      while (resolutionQueue.length) {
        dep = resolutionQueue.pop();

        const scope: EInjectionScope = dep.scope;
        const key: string = dep.serviceDefinition.name;
        let scopeMap: Map<string, any> | undefined;

        // If is cached, skip this resolution. Because the root service
        // is always the last element, it will fail this.
        switch (scope) {
          case EInjectionScope.SINGLETON:
            scopeMap = this.#depsSingleton;
            break;
          case EInjectionScope.TRANSIENT:
            scopeMap = this.#depsTransient;
            break;
          case EInjectionScope.REQUEST:
            scopeMap = this.#depsRequest;
            break;
        }
        if (scopeMap.has(key)) continue;

        const childDepDefinitions: Array<DependencyDefinition> = (
          Reflect.getMetadata(CONSTRUCTOR_TYPE_META_TOKEN, dep.serviceDefinition) ?? []
        ).map(({ name }: { name: string }): DependencyDefinition | undefined =>
          this.#serviceDefinitions.get(name)
        );

        // TODO check for null values here in childDepDefinitions
        const resolvedChildren: Array<any> = [];
        // Queue is read backwards, meaning this will never be called
        // unless the children are already cached
        for (const childDepDefinition of childDepDefinitions) {
          let childMap: Map<string, any>;
          const childScope: EInjectionScope = childDepDefinition.scope;
          const childKey: string = childDepDefinition.serviceDefinition.name;
          // TODO abstract this to a private method. It's used multiple times
          switch (childScope) {
            case EInjectionScope.SINGLETON:
              childMap = this.#depsSingleton;
              break;
            case EInjectionScope.TRANSIENT:
              childMap = this.#depsTransient;
              break;
            case EInjectionScope.REQUEST:
              childMap = this.#depsRequest;
              break;
          }
          resolvedChildren.push(childMap.get(childKey));
          console.log(
            `Hit cache for dependency with key: ${childKey} when resolving it's parent: ${key}, got ${childMap.get(
              childKey
            )}`
          );
        }
        instance = new dep.serviceDefinition(...resolvedChildren);
        scopeMap.set(key, instance);
        console.log(`Pushed dependency with ${key} to cache with scope: ${scope.toUpperCase()}`);
      }
      return instance;
    };

    // only gets called if root service is not already cached.
    const _resolve = (serviceDefinition: DependencyDefinition): any => {
      if (serviceDefinition === rootServiceDefinition) {
        resolutionQueue.push(serviceDefinition);
      }

      const childDeps =
        Reflect.getMetadata(CONSTRUCTOR_TYPE_META_TOKEN, serviceDefinition.serviceDefinition) ?? [];

      const childDefinitions: Array<DependencyDefinition> = childDeps.map(
        ({ name }: { name: string }) => this.#serviceDefinitions.get(name)
      );

      // TODO check for null here i.e. non registered service

      resolutionQueue.push(...childDefinitions);

      ptr++;
      if (ptr === resolutionQueue.length) {
        return _processQueue();
      }
      return _resolve(resolutionQueue[ptr]);
    };

    if (!rootServiceDefinition) return null;

    switch (rootServiceDefinition.scope) {
      case EInjectionScope.SINGLETON:
        return this.#depsSingleton.get(key) ?? _resolve(rootServiceDefinition);
      case EInjectionScope.TRANSIENT:
        throw new Error("Not impl");
      case EInjectionScope.REQUEST:
        return this.#depsRequest.get(key) ?? _resolve(rootServiceDefinition);
    }
  }

  instanciateAllSingletons() {
    for (const [key, definition] of this.#serviceDefinitions.entries()) {
      if (definition.scope === EInjectionScope.SINGLETON) {
        this.resolve<any>(key);
      }
    }
  }

  /**
   * Garbage collect function that will remove any dependencies
   * that are scoped as `EInjectionScope.REQUEST`
   */
  clearRequestDependencies() {
    this.#depsRequest.clear();
    // Javascript now garbage collects as no references to instances
    // exist, except for controller. When request is finished,
    // controller is binned, and then there are no references
    // to the instance anymore. (i.e garbage collected)
  }
}
