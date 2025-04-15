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
    const scopeLog: string[] = [];
    const errors: string[] = [];
    const warnigns: string[] = [];

    const rootScope = new Scope(null, 0);
    let currentScope = rootScope;
    let scopeLevel = 0;

    function enterScope() {
        const newScope = new Scope(currentScope, ++scopeLevel);//current as parent
        currentScope.addChild(newScope); //new scope as child to prev
        currentScope = newScope;
    }

    function exitScope() {
        if (currentScope.parent) { //if parent exists
            currentScope = currentScope.parent; // make parent scope current scope
            scopeLevel--; //decrement scope level
        }
    }

    function visit(node: TreeNode): void {
        switch (node.name) {

            case "[Block]":
                enterScope();
                for (const child of node.children) visit(child);
                exitScope();
                break;

            case "[VariableDeclaration]": {
                const type = node.children[0]?.name;
                const idNode = node.children[1];
                const name = idNode?.name;
                const { line, column } = idNode;

                if (name) {
                    const added = currentScope.declare({
                        name,
                        type,
                        line,
                        column,
                        isInitialized: false,
                        isUsed: false,
                    });

                    if (!added) {
                        errors.push(` Error: Variable '${name}' redeclared in same scope at line ${line}, col ${column}`);
                    }
                }
                break;
            }
            case "[AssignmentStatement]": {
                const idNode = node.children[0];
                const name = idNode?.name;
                const { line, column } = idNode;

                const symbol = currentScope.lookup(name);
                if (!symbol) {
                    errors.push(`Error: Undeclared variable '${name}' assigned at line ${line}, col ${column}`);
                }

                visit(node.children[1]); // RHS
                break;
            }
            case "[PrintStatement]":
                visit(node.children[0]);
                break;

            case "[IfStatement]":
            case "[WhileStatement]":
                visit(node.children[0]); // condition
                visit(node.children[1]); // block
                break;

            case "[Equals]":
            case "[NotEquals]":
            case "[Addition]":
                for (const child of node.children) visit(child);
                break;
            default:
                if (node.children.length === 0 && /^[a-z]$/.test(node.name)) {//regex matching var name
                    const symbol = currentScope.lookup(node.name);
                    if (!symbol) {
                        errors.push(` Error: Variable '${node.name}' used without declaration at line ${node.line}, col ${node.column}`);
                    }
                }

                for (const child of node.children) visit(child);
                break;
        }
    }

    if (ast.root) {
        visit(ast.root);
    }
    scopeLog.push("\n🧾 Scope Tree:\n" + rootScope.toString());

    if (errors.length) {
        scopeLog.push("\n Scope Errors:");
        for (const err of errors) scopeLog.push(err);
    } else {
        scopeLog.push("\n No scope errors found.");
    }

    return scopeLog;
}



