import { Project } from "ts-morph";
import fs from "fs";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

const appFile = project.getSourceFileOrThrow("src/App.tsx");
const appFunc = appFile.getFunctionOrThrow("App");

const fetchDataStmt = appFunc.getVariableStatementOrThrow(stmt => {
  return stmt.getText().includes('const fetchDataForMode = async');
});
const fetchFileListStmt = appFunc.getVariableStatementOrThrow(stmt => {
  return stmt.getText().includes('const fetchFileList = async');
});

console.log("Found:", fetchDataStmt.getText().substring(0, 50));
console.log("Found:", fetchFileListStmt.getText().substring(0, 50));
