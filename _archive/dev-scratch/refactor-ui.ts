import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

const appFile = project.getSourceFileOrThrow("src/App.tsx");
const appFunc = appFile.getFunctionOrThrow("App");

// Let's analyze where we can split.
const returnStmt = appFunc.getStatements().find(s => s.getKind() === SyntaxKind.ReturnStatement);
if (returnStmt) {
    console.log("Return block starts at line:", returnStmt.getStartLineNumber());
}
