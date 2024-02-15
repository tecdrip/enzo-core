import { Context, Env, Input } from "hono";

export function canHandleContext(c: Context) {
  console.log(c.req.header("content-type"));
}

export function canHandleContextTwo<
  T extends Env,
  P extends string,
  V extends Input
>(c: Context<T, P, V>) {
  console.log(c.req.header("content-type"));
}
