// environment.ts
// Environment class for managing variable bindings in the Lox interpreter.
// Provides a map from variable names to their values.

import { LoxValue } from "./expr";
import { Token } from "./token";
import { RuntimeError } from "./errors";

export class Environment {
  private values: Map<string, LoxValue> = new Map();

  define(name: string, value: LoxValue): void {
    // 새로운 변수 생성 (혹은 기존 변수 이름 덮어쓰기)
    this.values.set(name, value);
  }

  get(nameToken: Token): LoxValue {
    const lexeme = nameToken.lexeme;
    if (this.values.has(lexeme)) {
      return this.values.get(lexeme)!;
    }
    throw new RuntimeError(nameToken, `Undefined variable '${lexeme}'.`);
  }
}
