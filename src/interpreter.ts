import { RuntimeError } from "./errors";
import {
  Visitor,
  LoxValue,
  Binary,
  Grouping,
  Literal,
  Unary,
  VariableExpr,
  AssignExpr,
  Expr,
} from "./expr";
import {
  StmtVisitor,
  Stmt,
  ExpressionStmt,
  PrintStmt,
  VarStmt,
  BlockStmt,
} from "./stmt";
import { Lox } from "./main";
import { Token, TokenType } from "./token";
import { Environment } from "./environment";

function isTruthy(value: LoxValue): boolean {
  if (value === null) return false;
  if (value === false) return false;
  return true;
}

function checkNumberOperand(
  operator: Token,
  operand: LoxValue
): asserts operand is number {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "Operand must be a number.");
}

function stringify(value: LoxValue): string {
  if (value === null) return "nil";
  return value.toString();
}

export class Interpreter implements Visitor<LoxValue>, StmtVisitor<void> {
  private environment: Environment = new Environment();

  // ──────────────────────────────────────────────────────────
  // Expression visitor methods
  // ──────────────────────────────────────────────────────────
  visitBinary(expr: Binary): LoxValue {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left - right;
      case TokenType.SLASH:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left / right;
      case TokenType.STAR:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left * right;
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings."
        );
      case TokenType.GREATER:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left > right;
      case TokenType.GREATER_EQUAL:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left >= right;
      case TokenType.LESS:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left < right;
      case TokenType.LESS_EQUAL:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left <= right;
      case TokenType.BANG_EQUAL:
        return left !== right;
      case TokenType.EQUAL_EQUAL:
        return left === right;
    }

    return null;
  }

  visitGrouping(expr: Grouping): LoxValue {
    return this.evaluate(expr.expression);
  }

  visitLiteral(expr: Literal): LoxValue {
    return expr.value;
  }

  visitUnary(expr: Unary): LoxValue {
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case TokenType.MINUS:
        checkNumberOperand(expr.operator, right);
        return -right;
      case TokenType.BANG:
        return !isTruthy(right);
    }

    return null;
  }

  visitVariableExpr(expr: VariableExpr): LoxValue {
    return this.environment.get(expr.name);
  }

  visitAssignExpr(expr: AssignExpr): LoxValue {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  // ──────────────────────────────────────────────────────────
  // Statement visitor methods
  // ──────────────────────────────────────────────────────────
  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
    return;
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    console.log(stringify(value));
    return;
  }

  visitVarStmt(stmt: VarStmt): void {
    let value: LoxValue = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
    return;
  }

  visitBlockStmt(stmt: BlockStmt): void {
    // 새로운 지역 Environment 생성 (현재 environment를 부모로 설정)
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);
    try {
      for (const statement of stmt.statements) {
        this.execute(statement);
      }
    } finally {
      // 블록 실행 후 원래 환경으로 복귀
      this.environment = previousEnv;
    }
    return;
  }

  // ──────────────────────────────────────────────────────────
  // Public interface
  // ──────────────────────────────────────────────────────────
  interpret(statements: Stmt[]): void {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────
  private evaluate(expr: Expr): LoxValue {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }
}
