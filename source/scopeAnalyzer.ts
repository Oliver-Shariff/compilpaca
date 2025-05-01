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

export function analyzeScope(ast: Tree): { log: string[], rootScope: Scope } {
    const scopeLog: string[] = [];
    const warningLog: string[] = [];
    const errors: string[] = [];


    const rootScope = new Scope(null, 0);
    let currentScope = rootScope;
    let scopeLevel = -1;// set this to negative one so the first scope is 0

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

    function checkType(node: TreeNode, currentScope: Scope): string {
        if (!node) return "unknown";

        // Literal booleans
        if (node.name === "true" || node.name === "false") return "boolean";

        // Literal numbers
        if (/^\d+$/.test(node.name)) return "int";

        // Quoted string literal
        if (/^".*"$/.test(node.name)) return "string";

        // Variable name
        if (/^[a-z]$/.test(node.name)) {
            const symbol = currentScope.lookup(node.name);
            return symbol?.type ?? "unknown";
        }

        // Expressions
        switch (node.name) {
            case "[Addition]": {
                const left = checkType(node.children[0], currentScope);
                const right = checkType(node.children[1], currentScope);
                if (left === "int" && right === "int") return "int";
                return "typeerror";
            }
            case "[Equals]":
            case "[NotEquals]": {
                const left = checkType(node.children[0], currentScope);
                const right = checkType(node.children[1], currentScope);
                if (left === right) return "boolean";
                return "typeerror";
            }
            default:
                return "unknown";
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
                        errors.push(`Declaration error: Variable '${name}' redeclared in same scope at line ${line}, col ${column}`);
                    }
                }
                break;
            }
            case "[AssignmentStatement]": {
                const idNode = node.children[0];
                const valueNode = node.children[1];
                const name = idNode?.name;
                const { line, column } = idNode;

                const symbol = currentScope.lookup(name);
                if (!symbol) {
                    errors.push(`Undeclared variable '${name}' assigned at line ${line}, col ${column}`);
                } else {
                    const assignedType = checkType(valueNode, currentScope);
                    if (assignedType === "typeerror") {
                        errors.push(`Type mismatch in assignment to '${name}' at line ${line}, col ${column}`);
                    } else if (assignedType !== symbol.type) {
                        errors.push(`Type mismatch: cannot assign ${assignedType} to ${symbol.type} '${name}' at line ${line}, col ${column}`);
                    } else {
                        symbol.isInitialized = true;
                    }
                }

                visit(valueNode); 
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
                        errors.push(`Declaration Error: Variable '${node.name}' used without declaration at line ${node.line}, col ${node.column}`);
                    } else {
                        symbol.isUsed = true;
                    }

                }

                for (const child of node.children) visit(child);
                break;
        }
    }

    if (ast.root) {
        visit(ast.root);
    }
    //Start Error, warning, Success Logs
    if (errors.length) {
        scopeLog.push(`<span class="fail">FAIL Semantic Analyzer failed with ${errors.length} scope error(s):</span>`);
        for (const err of errors) scopeLog.push(`<span class="error">${err}</span>`);
        scopeLog.push(`\n`);
    } else {
        scopeLog.push(`<span class="success">INFO Semantic Analyzer - No scope errors found.</span>`);
        scopeLog.push(`\n`);
    }

    collectWarnings(rootScope);

    if (warningLog.length > 0) {
        scopeLog.push(`<span class="warning">Scope Warnings:</span>`);
        for (const warn of warningLog) {
            scopeLog.push(warn);
        }
        scopeLog.push(`\n`);
    } else {
        scopeLog.push(`<span class="success">INFO Semantic Analyzer - No scope warnings found.</span>\n`);
    }


    function collectWarnings(scope: Scope): void {
        for (const symbol of scope.symbols.values()) {
            const { name, line, column, isInitialized, isUsed } = symbol;

            if (!isUsed) {
                warningLog.push(`<span class="warning">'${name}' declared at line ${line}, col ${column} but never used.</span>`);
            }

            if (isUsed && !isInitialized) {
                warningLog.push(`<span class="warning">'${name}' used at line ${line}, col ${column} before being initialized.</span>`);
            }

            if (isInitialized && !isUsed) {
                warningLog.push(`<span class="warning">'${name}' initialized at line ${line}, col ${column} but never used.</span>`);
            }
        }

        for (const child of scope.children) {
            collectWarnings(child);
        }
    }
    //End Error, warning, Success Logs


    //Symbol Table Display
    scopeLog.push(`<span class="info">Symbol Table:</span>`);
    scopeLog.push(generateSymbolHTMLTable(rootScope));

    function generateSymbolHTMLTable(scope: Scope): string {
        let html = `<table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse;">`;
        html += `<thead><tr>
                    <th>NAME</th>
                    <th>TYPE</th>
                    <th>isINIT?</th>
                    <th>isUSED?</th>
                    <th>SCOPE</th>
                 </tr></thead><tbody>`;

        function recurse(s: Scope) {
            for (const symbol of s.symbols.values()) {
                html += `<tr>
                            <td>${symbol.name}</td>
                            <td>${symbol.type}</td>
                            <td>${symbol.isInitialized}</td>
                            <td>${symbol.isUsed}</td>
                            <td>${s.level}</td>
                         </tr>`;
            }
            for (const child of s.children) {
                recurse(child);
            }
        }

        recurse(scope);
        html += `</tbody></table>`;
        return html;
    }
    //Symbol Table end


    return {
        log: scopeLog,
        rootScope: rootScope,

    };
}

export { Scope, SymbolInfo };


