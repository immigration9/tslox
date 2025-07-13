#!/usr/bin/env ts-node
/**
 * generateAst.ts
 *
 * Usage:
 *   npx ts-node generateAst.ts <outputDir>
 *
 * 동작:
 *   - 스크립트 내 TYPES 배열에 노드 정의를 적는다.
 *   - <outputDir>/Expr.ts 를 자동 생성한다.
 *
 * 노드 정의 형식:
 *   "ClassName : FieldType fieldName, FieldType fieldName, ..."
 *     · ClassName     → 파생 클래스 이름
 *     · FieldType     → 다른 AST 베이스 타입, Token, primitive 등 자유롭게
 *     · fieldName     → 해당 필드 식별자 (소문자 카멜)
 */

import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = process.argv[2];
if (!OUTPUT_DIR) {
  console.error("Usage: ts-node generateAst.ts <outputDir>");
  process.exit(64);
}

/* === 1. 노드 정의 ============================================= */
const BASE_NAME = "Expr";
const TYPES = [
  "Binary   : Expr left, Token operator, Expr right",
  "Grouping : Expr expression",
  "Literal  : any value",
  "Unary    : Token operator, Expr right",
];

/* === 2. 메인 진입점 =========================================== */
generateAst(OUTPUT_DIR, BASE_NAME, TYPES);

/* === 3. 구현부 ================================================= */
function generateAst(outDir: string, baseName: string, types: string[]) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${baseName}.ts`);
  const writer: string[] = [];

  /* 3-1. 헤더 & Visitor 인터페이스 */
  writer.push(
    `// *** 자동 생성 파일 – 수정하지 마세요 ***\n`,
    `/* tslint:disable */\n`,
    `export abstract class ${baseName} {\n`,
    `  abstract accept<R>(visitor: Visitor<R>): R;\n`,
    `}\n\n`,
    `export interface Visitor<R> {`
  );
  for (const type of types) {
    const className = type.split(":")[0].trim();
    writer.push(`  visit${className}${baseName}(expr: ${className}): R;`);
  }
  writer.push("}\n");

  /* 3-2. 각 파생 클래스 정의 */
  for (const type of types) defineType(writer, baseName, type);

  /* 3-3. 파일 기록 */
  fs.writeFileSync(filePath, writer.join("\n"), { encoding: "utf8" });
  console.log(`✅  Generated ${filePath}`);
}
function defineType(out: string[], baseName: string, typeDef: string) {
  const [className, fieldList] = typeDef.split(":").map((s) => s.trim());
  const fields = fieldList
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  // 3-2-a. 클래스 헤더
  out.push(`\nexport class ${className} extends ${baseName} {`);

  // 3-2-b. 필드 선언
  for (const field of fields) {
    const [type, name] = field.split(/\s+/);
    out.push(`  readonly ${name}: ${type};`);
  }

  // 3-2-c. 생성자
  out.push(
    `\n  constructor(${fields
      .map((field) => {
        const [type, name] = field.split(/\s+/);
        return `${name}: ${type}`;
      })
      .join(", ")}) {`
  );
  out.push("    super();");
  for (const field of fields) {
    const [, name] = field.split(/\s+/);
    out.push(`    this.${name} = ${name};`);
  }
  out.push("  }");

  // 3-2-d. accept() 메서드
  out.push(
    `\n  accept<R>(visitor: Visitor<R>): R {`,
    `    return visitor.visit${className}${baseName}(this);`,
    "  }",
    "}"
  );
}
