// Copyright 2020 Liam Tan. All rights reserved. MIT license.

/**
 * `MethodDecorator` responsible for assigning metadata to given method of function
 * to be triggered before request is executed. Useful for validation or logging 
 * purposes
 */
export function Before(fn: Function): MethodDecorator {
    return (target: any, propertyKey: string | Symbol): void => {
        fn();
    };
}
