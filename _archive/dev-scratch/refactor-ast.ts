import { Project, SyntaxKind, Node } from "ts-morph";
import fs from "fs";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

const sourceFile = project.getSourceFileOrThrow("src/App.tsx");

// 1. Create Layout Components
const sharedDir = project.createDirectory("src/shared");
const pagesDir = project.createDirectory("src/pages");
const modulesDir = project.createDirectory("src/modules");
const hooksDir = project.createDirectory("src/hooks");

// Let's create an AST extraction script that analyzes the file.
console.log("TS Morph loaded cleanly.");
