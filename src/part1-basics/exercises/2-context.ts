import { Context, Effect, Layer } from "effect";
import * as T from "../../testDriver.ts";

interface FooImpl {
  readonly bar: Effect.Effect<string>;
}

class Foo extends Context.Tag("Foo")<Foo, FooImpl>() {
  static readonly Live = Layer.succeed(Foo, {
    bar: Effect.succeed("imFromContext!"),
  });
}

/**
 * # Exercise 1:
 *
 * `Tag` being a subtype of `Effect` is a bit too easy...
 * try to get the `Foo` service from context manually :)
 */

const test1 = Effect.gen(function* () {
  const {
    constants: { bar },
  } = Effect.serviceMembers(Foo);
  return yield* bar;
}).pipe(Effect.provide(Foo.Live));

await T.testRunAssert(1, test1, { success: "imFromContext!" });

/**
 * # Exercise 2
 */

interface RandomImpl {
  readonly nextInt: Effect.Effect<number>;
  readonly nextBool: Effect.Effect<boolean>;
  readonly nextIntBetween: (min: number, max: number) => Effect.Effect<number>;
}

class Random extends Context.Tag("Random")<Random, RandomImpl>() {
  static readonly Live = Layer.succeed(Random, {
    nextInt: Effect.succeed(42),
    nextBool: Effect.succeed(true),
    nextIntBetween: (min, max) => Effect.succeed(min + max),
  });
}

/**
 * Having to get the service, just to use a single property or function is a bit annoying
 * For convenience lets create Effects (or functions that return Effects) themselves already depend on the service
 */

const test2 = Effect.gen(function* () {
  const {
    constants: { nextInt, nextBool },
    functions: { nextIntBetween },
  } = Effect.serviceMembers(Random);

  const int = yield* nextInt;
  const bool = yield* nextBool;
  const intBetween = yield* nextIntBetween(10, 20);
  return { int, bool, intBetween };
}).pipe(Effect.provide(Random.Live));

await T.testRunAssert(2, test2, {
  success: { int: 42, bool: true, intBetween: 30 },
});
