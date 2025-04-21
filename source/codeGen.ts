import { Tree } from './tree.js';
import { Scope } from './scopeAnalyzer.js';

export function generateCode(ast: Tree, symbolTable: Scope): number[] {
    const code: number[] = new Array(256).fill(0x00);
    return code;
}
