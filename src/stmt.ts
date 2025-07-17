// stmt.ts
// AST node hierarchy for statements in the Lox language.
// Statements don't produce values but have side effects.
//
// Usage pattern:
//   const stmt: Stmt = ...;
//   stmt.accept(visitor);
// where `visitor` is an implementation of the StmtVisitor interface.

import { Expr } from "./expr";

/** Generic StmtVisitor interface (double-dispatch). */
export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: ExpressionStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
}

/** Base statement class. */
export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

// ────────────────────────────────────────────────────────────
// Individual statement subclasses
// ────────────────────────────────────────────────────────────

export class ExpressionStmt extends Stmt {
  constructor(public readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class PrintStmt extends Stmt {
  constructor(public readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}
