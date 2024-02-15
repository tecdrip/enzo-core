import { Context } from "hono";

export function canHandleContext(c: Context) {
  console.log(c.req.header("content-type"));
}
