// Expr.ts
// AST node hierarchy for expressions in the Lox language.
// Ported to TypeScript from Bob Nystrom’s Crafting Interpreters.
//
// Usage pattern:
//   const ast: Expr = ...;
//   const result = ast.accept(visitor);
// where `visitor` is an implementation of the Visitor interface.

import { Token } from "./token";

export type LoxValue = number | string | boolean | null;

/** Generic Visitor interface (double-dispatch). */
export interface Visitor<R> {
  visitBinary(expr: Binary): R;
  visitGrouping(expr: Grouping): R;
  visitLiteral(expr: Literal): R;
  visitUnary(expr: Unary): R;
  visitVariableExpr(expr: VariableExpr): R;
  visitAssignExpr(expr: AssignExpr): R;
}

/** Base expression class. */
export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

// ────────────────────────────────────────────────────────────
// Individual expression subclasses
// ────────────────────────────────────────────────────────────

export class Binary extends Expr {
  constructor(
    public readonly left: Expr,
    public readonly operator: Token,
    public readonly right: Expr
  ) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinary(this);
  }
}

export class Grouping extends Expr {
  constructor(public readonly expression: Expr) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGrouping(this);
  }
}

export class Literal extends Expr {
  constructor(public readonly value: LoxValue) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteral(this);
  }
}

export class Unary extends Expr {
  constructor(public readonly operator: Token, public readonly right: Expr) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnary(this);
  }
}

export class VariableExpr extends Expr {
  constructor(public readonly name: Token) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}

export class AssignExpr extends Expr {
  constructor(public readonly name: Token, public readonly value: Expr) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

// ────────────────────────────────────────────────────────────
// Utility: Pretty-printer visitor (optional)
// ────────────────────────────────────────────────────────────

/**
 * Returns a parenthesized Lisp-style string representation of the AST.
 */
export class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinary(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGrouping(expr: Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteral(expr: Literal): string {
    return expr.value === null ? "nil" : String(expr.value);
  }

  visitUnary(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitVariableExpr(expr: VariableExpr): string {
    return expr.name.lexeme;
  }

  visitAssignExpr(expr: AssignExpr): string {
    return this.parenthesize("assign", new VariableExpr(expr.name), expr.value);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    return `(${name} ${exprs.map((e) => e.accept(this)).join(" ")})`;
  }
}
