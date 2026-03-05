import type { AstroComponentFactory } from "astro/runtime/server/index.js";

export default interface BoxProps {
  title?: string;
  class?: string;
  type?: AstroComponentFactory;
  index?: number;
}