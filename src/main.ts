import * as fs from "node:fs";
import * as readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { Scanner } from "./scanner";
import { RuntimeError } from "./errors";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";

export class Lox {
  static hadError: boolean = false;
  static hadRuntimeError: boolean = false;

  static main(): void {
    const args = process.argv.slice(2);

    if (args.length > 1) {
      console.log("Usage: jlox [script]");
      process.exit(64);
    } else if (args.length === 1) {
      Lox.runFile(args[0]);
    } else {
      Lox.runPrompt();
    }
  }

  static runFile(path: string): void {
    try {
      const bytes = fs.readFileSync(path);
      Lox.run(bytes.toString("utf-8"));

      if (this.hadError) {
        process.exit(65);
      }
      if (this.hadRuntimeError) {
        process.exit(70);
      }
    } catch (err) {
      console.error(`Could not read file ${path}:`, err);
      process.exit(65);
    }
  }

  static runPrompt(): void {
    const rl = readline.createInterface({
      input,
      output,
      prompt: "> ",
    });

    rl.on("line", (line) => {
      if (line === null) {
        rl.close();
      } else {
        Lox.run(line);
        this.hadError = false;
        rl.prompt();
      }
    });
    rl.on("close", () => {
      process.exit(0);
    });

    rl.prompt();
  }

  static run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    // Stop if there was a lexical error
    if (this.hadError) return;

    const parser = new Parser(tokens);
    const statements = parser.parse();

    // Stop if there was a syntax error
    if (this.hadError) return;

    const interpreter = new Interpreter();
    interpreter.interpret(statements);
  }

  static error(line: number, message: string) {
    this.report(line, "", message);
  }

  static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this.hadError = true;
  }

  static runtimeError(error: RuntimeError): void {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    this.hadRuntimeError = true;
  }
}

Lox.main();
