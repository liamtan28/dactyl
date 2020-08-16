import { Newable, EInjectionScope, DependencyDefinition, RequestLifetime } from "../types.ts";
import { v4 } from "../deps.ts";

import {
  INJECTION_ID_META_TOKEN,
  INJECTION_SCOPE_META_TOKEN,
  CONSTRUCTOR_TYPE_META_TOKEN,
} from "./index.ts";

import { Reflect } from "./reflect-poly.ts";

// TODO there is potentially a bug here. I think that
// Transient services aren't being created every time
// they are created definitely every time a resolution
// is called on the container or lifetime, but if the
// same transient is required in the one resolution
// tree, it will be the same instance.

/**
 * `DependencyContainer`, used to register and resolve injected dependencies
 */
export class DependencyContainer {
  /** Definitions */
  #serviceDefinitions: Map<string, DependencyDefinition>;
  /** Cached instances of dependencies */
  #singletonCache: Map<string, any>;
  #requestCache: Map<string, Map<string, any>>;

  constructor() {
    this.#serviceDefinitions = new Map<string, DependencyDefinition>();
    this.#singletonCache = new Map<string, any>();
    this.#requestCache = new Map<string, Map<string, any>>();
  }
  /**
   * `register` function will register an instance inside the `DependencyContainer`.
   *  An optional key can be provided to specify the retrieval key when resolving
   *  using the `@Inject()` decorator, but this will default to use the implicit
   *  type name.
   */
  register(newable: Newable<any>, scope: EInjectionScope, key: string) {
    this.#serviceDefinitions.set(key, {
      scope,
      newable,
    });
  }

  /**
   * Request new lifetime. This will scope all REQUEST scoped services
   * To it's own "container". You call resolve directly off this m3ethod
   */
  newRequestLifetime(): RequestLifetime {
    // Store unique ID out of IIFE here so it retains reference.
    // DANGER this might be a memory leak.
    const requestId: string = v4.generate();
    return (() => {
      this.#requestCache.set(requestId, new Map<string, any>());
      return {
        requestId,
        resolve: (key: string): any | null => this.resolve(key, requestId),
        end: (): void => this.endRequestLifetime(requestId),
      };
    })();
  }
  endRequestLifetime(requestId: string) {
    this.#requestCache.get(requestId)?.clear();
  }

  /**
   * Helper method: scope cannot decrease in size in the dependency tree.
   * As an example, Singleton -> Request is an invalid dependency
   * relationship as Singleton services are only instanciated
   * once.
   *
   * Only transient services can depend on transient services. Transient
   * services are instantiated every time they are resolved, so a
   * singleton or request service cannot be cached if they
   * depend on transient.
   *
   * This method checks that the child deps of a parent are not smaller
   * in scope.
   */
  #childHasSmallerScope = (
    parentScope: EInjectionScope,
    children: Array<DependencyDefinition>
  ): boolean => {
    const sizeArray: Array<EInjectionScope> = [
      EInjectionScope.TRANSIENT,
      EInjectionScope.REQUEST,
      EInjectionScope.SINGLETON,
    ];
    for (const child of children) {
      if (sizeArray.indexOf(child.scope) < sizeArray.indexOf(parentScope)) {
        return true;
      }
    }
    return false;
  };

  resolve<T>(key: string, requestId?: string | undefined): T | null {
    const resolutionQueue: Array<DependencyDefinition> = [];
    const rootServiceDefinition: DependencyDefinition | undefined = this.#serviceDefinitions.get(
      key
    );

    let ptr = 0;

    const _selectCacheFromScope = (scope: EInjectionScope, requestId?: string): any => {
      switch (scope) {
        case EInjectionScope.SINGLETON:
          return this.#singletonCache;
        case EInjectionScope.REQUEST:
          if (!requestId) {
            throw new Error(`
              Attempted to resolve REQUEST scoped dependency outside of RequestLifetime.
              REQUEST scoped dependencies may only be resolved by calling
              DependencyContainer.newRequestLifetime().resolve("key");
            `);
          }
          return this.#requestCache.get(requestId);
      }
    };

    const _processQueue = (): any => {
      console.log("Received queue:", resolutionQueue);
      // TODO do a size check here. Remember, a requests scope can only
      // increase or stay the same in a dependency tree, so:
      // Request -> Request -> Singleton is allowed
      // Singleton -> Request is invalid
      // Singleton -> Transient is invalid
      // Transient -> Singleton is valid
      // Transient -> Request -> Singleton is valid
      // Request -> Transient -> Singleton is invalid

      let instance: any;

      const transientLocalCache: Map<string, any> = new Map<string, any>();

      while (resolutionQueue.length) {
        const dep: DependencyDefinition = <DependencyDefinition>resolutionQueue.pop();

        const parentScope: EInjectionScope = dep.scope;
        const parentKey: string = dep.newable.name;

        const parentCache: Map<string, any> | undefined = _selectCacheFromScope(
          parentScope,
          requestId
        );
        // Will always be false for transient dependencies
        if (parentCache?.has(key)) continue;

        const childDepDefinitions: Array<DependencyDefinition> = (
          Reflect.getMetadata(CONSTRUCTOR_TYPE_META_TOKEN, dep.newable) ?? []
        ).map(({ name }: { name: string }): DependencyDefinition | undefined =>
          this.#serviceDefinitions.get(name)
        );

        if (this.#childHasSmallerScope(parentScope, childDepDefinitions)) {
          throw new Error(
            `Parent dependency "${parentKey}" depends on children with smaller scope (${childDepDefinitions.map(
              (c) => c.newable.name
            )}). Scope can only increase in size in your tree (Transient -> Request -> Singleton).`
          );
        }

        // TODO check for null values here in childDepDefinitions
        const resolvedChildren: Array<any> = [];
        // Queue is read backwards, so any parent with child dependencies
        // will get them from cache
        for (const childDepDefinition of childDepDefinitions) {
          const childScope: EInjectionScope = childDepDefinition.scope;
          const childKey: string = childDepDefinition.newable.name;

          // If this dep is transient, it's deps will can be transient, singleton
          // or request. In this case, the child is transient, so look for the
          // local transient cache for the instance.
          if (childScope === EInjectionScope.TRANSIENT) {
            resolvedChildren.push(transientLocalCache.get(childKey));
            continue;
          }

          const childCache: Map<string, any> | undefined = _selectCacheFromScope(
            childScope,
            requestId
          );
          resolvedChildren.push(childCache?.get(childKey));
        }
        instance = new dep.newable(...resolvedChildren);

        // Skip container cache on transient.
        if (parentScope === EInjectionScope.TRANSIENT) {
          transientLocalCache.set(parentKey, instance);
          continue;
        }

        parentCache?.set(parentKey, instance);
      }
      return instance;
    };

    const _resolve = (serviceDefinition: DependencyDefinition): any => {
      console.log("New resolution discover iteration", serviceDefinition);
      if (serviceDefinition === rootServiceDefinition) {
        resolutionQueue.push(serviceDefinition);
      }

      const childDeps =
        Reflect.getMetadata(CONSTRUCTOR_TYPE_META_TOKEN, serviceDefinition.newable) ?? [];

      const childDefinitions: Array<DependencyDefinition> = childDeps.map(
        ({ name }: { name: string }) => this.#serviceDefinitions.get(name)
      );

      // TODO check for null here i.e. non registered service
      // We grabbed this straight fgrom constructor, what if
      // one arg is not wanting to be injected?
      resolutionQueue.push(...childDefinitions);
      console.log("Adding to resolution queue", childDefinitions);
      ptr++;
      if (ptr === resolutionQueue.length) {
        return _processQueue();
      }
      return _resolve(resolutionQueue[ptr]);
    };

    if (!rootServiceDefinition) return null;

    const cache: Map<string, any> = _selectCacheFromScope(rootServiceDefinition.scope, requestId);

    return cache?.get(key) ?? _resolve(rootServiceDefinition);
  }

  instantiateAllSingletons() {
    for (const [key, definition] of this.#serviceDefinitions.entries()) {
      if (definition.scope === EInjectionScope.SINGLETON) {
        this.resolve<any>(key);
      }
    }
  }
}
