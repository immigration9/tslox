import { Token } from "./token";

export class RuntimeError extends Error {
  constructor(public token: Token, public message: string) {
    super(message);
  }
}
