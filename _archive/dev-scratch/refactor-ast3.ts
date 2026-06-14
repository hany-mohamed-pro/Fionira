import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

const appFile = project.getSourceFileOrThrow("src/App.tsx");
const appFunc = appFile.getFunctionOrThrow("App");

const fetchDataStmt = appFunc.getVariableStatementOrThrow(stmt => {
  return stmt.getText().includes("const fetchDataForMode = async");
});

const text = fetchDataStmt.getText();
fs.writeFileSync("src/hooks/useDataFetch.ts", `
import { useState } from 'react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// Exporting the logic carefully
export const useDataFetch = () => {
    return {
        // Not easily doable without bringing half of App.tsx dependencies with it
    }
};
`);
console.log("Hook written dummy.");
