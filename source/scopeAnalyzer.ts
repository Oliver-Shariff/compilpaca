import { Tree, TreeNode } from './tree.js';

interface SymbolInfo {
    name: string;
    type: string;
    line?: number;
    column?: number;
    isInitialized: boolean;
    isUsed: boolean;
}

class Scope {
    symbols: Map<string, SymbolInfo> = new Map(); //map variable to it's info
    parent: Scope | null; // pointer to parent scope, null if global
    children: Scope[] = []; // list of children scope
    level: number; // depth of scope

    constructor(parent: Scope | null, level: number) {
        this.parent = parent;
        this.level = level;
    }

    addChild(scope: Scope) {
        this.children.push(scope);
    }

    lookup(name: string): SymbolInfo | null {
        if (this.symbols.has(name)) return this.symbols.get(name)!;
        return this.parent?.lookup(name) || null;
    }

    declare(symbol: SymbolInfo): boolean {
        if (this.symbols.has(symbol.name)) return false; // return false if already used
        this.symbols.set(symbol.name, symbol);
        return true;
    }
}

export function analyzeScope(ast: Tree): string[] {

}
