// environment.ts
// Environment class for managing variable bindings in the Lox interpreter.
// Provides a map from variable names to their values.

import { LoxValue } from "./expr";
import { Token } from "./token";
import { RuntimeError } from "./errors";

export class Environment {
  private values: Map<string, LoxValue> = new Map();
  readonly enclosing: Environment | null;

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  define(name: string, value: LoxValue): void {
    // 새로운 변수 생성 (혹은 기존 변수 이름 덮어쓰기)
    this.values.set(name, value);
  }

  get(nameToken: Token): LoxValue {
    const lexeme = nameToken.lexeme;
    if (this.values.has(lexeme)) {
      return this.values.get(lexeme)!;
    }
    // 현재 환경에 없다면 부모 환경으로 위임
    if (this.enclosing !== null) {
      return this.enclosing.get(nameToken);
    }
    throw new RuntimeError(nameToken, `Undefined variable '${lexeme}'.`);
  }

  assign(nameToken: Token, value: LoxValue): void {
    const lexeme = nameToken.lexeme;
    if (this.values.has(lexeme)) {
      this.values.set(lexeme, value);
    } else if (this.enclosing !== null) {
      // 현재 없으면 부모 쪽에 할당 시도
      this.enclosing.assign(nameToken, value);
    } else {
      throw new RuntimeError(nameToken, "Undefined variable '" + lexeme + "'.");
    }
  }
}
