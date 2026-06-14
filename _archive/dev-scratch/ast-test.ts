import { Project } from "ts-morph";
import fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths("src/App.tsx");
const sourceFile = project.getSourceFileOrThrow("src/App.tsx");

const appFunction = sourceFile.getFunction("App");

console.log("App children:", appFunction?.getVariableDeclarations().map(d => d.getName()).join(', '));
