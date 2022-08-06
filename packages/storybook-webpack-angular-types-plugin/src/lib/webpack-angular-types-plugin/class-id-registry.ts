export type WebpackModuleId = number | string;

const moduleClassRegistries = new Map<WebpackModuleId, Map<string, number>>();
const classCounter = new Map<string, number>();

function getValueForKeyOrThrow<TKey, TValue>(
    map: Map<TKey, TValue>,
    key: TKey
): TValue {
    const value = map.get(key);
    if (value === undefined) {
        throw new Error(`Could not find value for key ${key}`);
    }
    return value;
}

function requestIdForClassName(className: string): number {
    if (classCounter.has(className)) {
        const value = getValueForKeyOrThrow(classCounter, className);
        classCounter.set(className, value + 1);
        return value;
    } else {
        classCounter.set(className, 1);
        return 0;
    }
}

export function getGlobalUniqueIdForClass(
    moduleId: WebpackModuleId,
    className: string
): number {
    if (!moduleClassRegistries.has(moduleId)) {
        moduleClassRegistries.set(moduleId, new Map());
    }
    const moduleClassRegistry = getValueForKeyOrThrow(
        moduleClassRegistries,
        moduleId
    );
    if (moduleClassRegistry.has(className)) {
        return getValueForKeyOrThrow(moduleClassRegistry, className);
    } else {
        const requestedId = requestIdForClassName(className);
        moduleClassRegistry.set(className, requestedId);
        return requestedId;
    }
}
