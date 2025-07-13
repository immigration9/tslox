import { AstPrinter } from "./expr";
import { Parser } from "./parser";
import { Scanner } from "./scanner";

const source = "(1 + 2) * 3 == 5";
const scanner = new Scanner(source);
const tokens = scanner.scanTokens();
const parser = new Parser(tokens);
const expression = parser.parse();
// Walk or pretty-print your AST here

const ast = new AstPrinter().print(expression);

console.log(JSON.stringify(ast, null, 2));
