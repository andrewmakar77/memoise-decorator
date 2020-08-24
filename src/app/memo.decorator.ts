import 'reflect-metadata';

export type Dictionary<T = unknown> = {
  [index in PropertyKey]: T;
};

type TRecord = {
  previousArgs: unknown[] | undefined;
  previousReturnValue: unknown | undefined;
};

function argsEqual<T1 extends unknown, T2 extends unknown>(args1: T1[] | undefined, args2: T2[]) {
  if (args1?.length !== args2?.length) {
    return false;
  }

  if (args1 === args2 || (args1?.length === 0 && args2?.length === 0)) {
    return true;
  }

  const length = Math.max(args1?.length, args2?.length);

  for (let index = 0; index < length; index++) {
    const arg1 = args1[index];
    const arg2 = args2[index];

    if (arg1 !== arg2) {
      return false;
    }
  }

  return true;
}

function MemoiseMethodFactory<TProto>(method: <T>(...args: unknown[]) => T) {
  const key = Symbol('memoise');
  return function MemoiseMethod<TInstance extends TProto>(this: TInstance, ...args: unknown[]) {
    // Define metadata with 'memoise' key
    if (!Reflect.hasOwnMetadata(key, this)) {
      Reflect.defineMetadata(
        key,
        {
          previousArgs: undefined,
          previousReturnValue: undefined
        },
        this
      );
    }

    // Get defined metadata
    const metadataEntry = Reflect.getOwnMetadata(key, this) as TRecord;

    // If methods arguments is the same return previous value
    if (argsEqual(metadataEntry.previousArgs, args)) {
      return metadataEntry.previousReturnValue;
    }

    // If methods arguments is not equal - reassign new metadata and return new value
    metadataEntry.previousArgs = args;
    metadataEntry.previousReturnValue = method.apply(this, args);

    return metadataEntry.previousReturnValue;
  };
}

function MemoiseGetterFactory<TProto>(getter: <T>() => T, property: PropertyKey) {
  const key = Symbol('memoise');

  return function MemoiseGetter<TInstance extends TProto & Dictionary>(this: TInstance) {
    if (!Reflect.hasOwnMetadata(key, this)) {
      const previousReturnValue = getter.apply(this);

      Reflect.defineMetadata(key, previousReturnValue, this);

      Object.defineProperties(this, {
        [property]: {
          get() {
            return previousReturnValue;
          },
          configurable: true
        }
      });
    }

    return Reflect.getOwnMetadata(key, this);
  };
}

function MemoiseDecorator() {
  return <TProto extends object>(_target: TProto, property: PropertyKey, descriptor: PropertyDescriptor) => {

    // MEMOISE CLASS METHOD
    if (descriptor.value) {
      const method = descriptor.value as <T>(...args: unknown[]) => T;

      // Reassign descriptor.value with memoised method
      descriptor.value = MemoiseMethodFactory<TProto>(method);
    }

    // MEMOISE CLASS GETTER
    if (descriptor.get) {
      const getter = descriptor.get as <T>() => T;

      descriptor.get = MemoiseGetterFactory<TProto>(getter, property);
    }

    return descriptor;
  };
}

export { MemoiseDecorator as Memoise };
