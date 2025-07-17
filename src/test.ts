import { AstPrinter } from "./expr";
import { Parser } from "./parser";
import { Scanner } from "./scanner";

const source = 'var beverage = "espresso"; print beverage;';
const scanner = new Scanner(source);
const tokens = scanner.scanTokens();
const parser = new Parser(tokens);
const statements = parser.parse();
// Walk or pretty-print your AST here

// Print the tokens and statements for debugging
console.log("Tokens:");
tokens.forEach((token, i) => {
  console.log(`${i}: ${token.toString()}`);
});

console.log("\nStatements:");
console.log(JSON.stringify(statements, null, 2));
