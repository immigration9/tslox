// parser.ts
// Recursive-descent Pratt-style parser for the "Lox" language,
// ported to TypeScript from Chapter 6 "Parsing Expressions" of
// Crafting Interpreters.
//
// Updated to handle statements according to BNF grammar:
// declaration ::= varDecl | statement ;
// varDecl ::= "var" IDENTIFIER ( "=" expression )? ";" ;
// statement ::= exprStmt | printStmt ;
// exprStmt ::= expression ";" ;
// printStmt ::= "print" expression ";" ;
//
// It assumes the following supporting types exist:
//
//   - enum TokenType  (LEFT_PAREN, RIGHT_PAREN, BANG, BANG_EQUAL,
//                      EQUAL, EQUAL_EQUAL, GREATER, GREATER_EQUAL,
//                      LESS, LESS_EQUAL, PLUS, MINUS, STAR, SLASH,
//                      IDENTIFIER, STRING, NUMBER, TRUE, FALSE, NIL,
//                      EOF, etc.)
//
//   - class Token { lexeme: string; type: TokenType; literal: any; line: number }
//
//   - Expression hierarchy generated using the Visitor pattern
//     (classes Binary, Unary, Grouping, Literal, Expr)
//
//   - Statement hierarchy generated using the Visitor pattern
//     (classes ExpressionStmt, PrintStmt, Stmt)
//
// Feel free to tweak the imports to match your project layout.
import { Token, TokenType } from "./token";
import * as Expr from "./expr";
import { Stmt, ExpressionStmt, PrintStmt, VarStmt } from "./stmt";

/**
 * Parser converts a linear sequence of tokens
 * into an abstract syntax tree (AST).
 */
export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) {}

  /**
   * Entry point for callers.
   * Parses a program (sequence of declarations).
   * Throws ParseError on any syntax error.
   */
  public parse(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration());
      } catch (error) {
        if (error instanceof ParseError) {
          this.synchronize();
          throw error;
        }
        throw new ParseError("Unknown parsing error.");
      }
    }

    return statements;
  }

  // ──────────────────────────────────────────────────────────
  // Declaration Grammar:
  //
  // declaration ::= varDecl | statement ;
  // varDecl ::= "var" IDENTIFIER ( "=" expression )? ";" ;
  // ──────────────────────────────────────────────────────────

  private declaration(): Stmt {
    if (this.match(TokenType.VAR)) return this.varDeclaration();
    return this.statement();
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    let initializer: Expr.Expr | null = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new VarStmt(name, initializer);
  }

  // ──────────────────────────────────────────────────────────
  // Statement Grammar:
  //
  // statement ::= exprStmt | printStmt ;
  // exprStmt ::= expression ";" ;
  // printStmt ::= "print" expression ";" ;
  // ──────────────────────────────────────────────────────────

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new PrintStmt(value);
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExpressionStmt(expr);
  }

  // ──────────────────────────────────────────────────────────
  // Expression Grammar (lowest → highest precedence):
  //
  // expression     → equality ;
  // equality       → comparison ( ( "!=" | "==" ) comparison )* ;
  // comparison     → addition ( ( ">" | ">=" | "<" | "<=" ) addition )* ;
  // addition       → multiplication ( ( "-" | "+" ) multiplication )* ;
  // multiplication → unary ( ( "/" | "*" ) unary )* ;
  // unary          → ( "!" | "-" ) unary
  //                | primary ;
  // primary        → NUMBER | STRING | "true" | "false" | "nil"
  //                | "(" expression ")"
  //                | IDENTIFIER ;
  // ──────────────────────────────────────────────────────────

  private expression(): Expr.Expr {
    return this.equality();
  }

  private equality(): Expr.Expr {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  private comparison(): Expr.Expr {
    let expr = this.addition();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.addition();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  private addition(): Expr.Expr {
    let expr = this.multiplication();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.multiplication();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  private multiplication(): Expr.Expr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  private unary(): Expr.Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Expr.Unary(operator, right);
    }
    return this.primary();
  }

  private primary(): Expr.Expr {
    if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.match(TokenType.NIL)) return new Expr.Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Expr.Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Expr.VariableExpr(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  // ──────────────────────────────────────────────────────────
  // Helper utilities
  // ──────────────────────────────────────────────────────────
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  // ──────────────────────────────────────────────────────────
  // Error handling & synchronisation
  // ──────────────────────────────────────────────────────────
  private error(token: Token, message: string): ParseError {
    // Forward error to the caller; could hook into reporter here.
    return new ParseError(
      `[line ${token.line}] Error at '${token.lexeme}': ${message}`
    );
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}

/**
 * Simple wrapper to distinguish parse errors from other runtime errors.
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}
