// stmt.ts
// AST node hierarchy for statements in the Lox language.
// Statements don't produce values but have side effects.
//
// Usage pattern:
//   const stmt: Stmt = ...;
//   stmt.accept(visitor);
// where `visitor` is an implementation of the StmtVisitor interface.

import { Expr } from "./expr";
import { Token } from "./token";

/** Generic StmtVisitor interface (double-dispatch). */
export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: ExpressionStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitVarStmt(stmt: VarStmt): R;
  visitBlockStmt(stmt: BlockStmt): R;
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

export class VarStmt extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly initializer: Expr | null
  ) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class BlockStmt extends Stmt {
  constructor(public readonly statements: Stmt[]) {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}
