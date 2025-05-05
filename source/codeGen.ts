import { Tree, TreeNode } from './tree.js';
import { Scope } from './scopeAnalyzer.js';


class Static {
    name: string;
    id: string; //variable name
    scope: number;
    size: number; //not using length to avoid static.length vs static[].length confusion
    stackTargets: number[] = [] //all the target locations in code array that need to be overwritten
    heapLocation: number = -1; // the actual mem location of the variable
    stringValue?: string;

    constructor(id: string, scope: number, size?: number) {
        this.id = id;
        this.scope = scope;
        this.size = size;
        this.name = `${id}@${scope}`; //for clean debug

    }

}
const staticTable: Static[] = []
const code: number[] = new Array(256).fill(0x00);
let codeIndex = 0;
let staticIndex = 0;
let tempCounter = 0;



function addLocation(name: string, location: number) {
    for (let i = 0; i < staticTable.length; i++) {
        if (staticTable[i].name == name) {
            staticTable[i].stackTargets.push(location);
        }
    }
}

function generateBaseExpression(node: TreeNode): void {
    if (node.name === "[Addition]") {
        //left must be digit
        //right is digit addition, or id
        let left = node.children[0];
        let right = node.children[1];
        code[codeIndex++] = 0xA9;
        code[codeIndex++] = parseInt(left.name);
        code[codeIndex++] = 0x8D;
        const tempAdd = new Static(`temp${tempCounter++}`, 0); // create a temp static to hold addition during process
        staticTable[staticIndex++] = tempAdd;
        addLocation(tempAdd.name, codeIndex);
        code[codeIndex++] = 0x00;
        code[codeIndex++] = 0x00;
        if (/^\d+$/.test(right.name)) {// right = digit
            code[codeIndex++] = 0xA9;
            code[codeIndex++] = parseInt(right.name);
            code[codeIndex++] = 0x6D;
            addLocation(tempAdd.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x8D;
            addLocation(tempAdd.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
            /*
            */
        }
        else if (right.name === "[Addition]") {
            generaterRecurseExpression(right,tempAdd);
        }
    } else if (/^[a-z]$/.test(node.name)) {
        const ref = findScopeFromAST(node.name, node);
        if (!ref) throw new Error(`Var '${node.name}' not found`);
        code[codeIndex++] = 0xAD;
        addLocation(ref.name, codeIndex);
        code[codeIndex++] = 0x00;
        code[codeIndex++] = 0x00;
    }
}
function generaterRecurseExpression(node: TreeNode, tempAdd: Static): void {
    if (node.name === "[Addition]") {
        //left must be digit
        //right is digit addition, or id
        let left = node.children[0];
        let right = node.children[1];
        code[codeIndex++] = 0xA9;
        code[codeIndex++] = parseInt(left.name);
        code[codeIndex++] = 0x6D;
        staticTable[staticIndex++] = tempAdd;
        addLocation(tempAdd.name, codeIndex);
        code[codeIndex++] = 0x00;
        code[codeIndex++] = 0x00;
        code[codeIndex++] = 0x8D;
        addLocation(tempAdd.name, codeIndex);
        code[codeIndex++] = 0x00;
        code[codeIndex++] = 0x00;

        if (/^\d+$/.test(right.name)) {// right = digit
            code[codeIndex++] = 0xA9;
            code[codeIndex++] = parseInt(right.name);
            code[codeIndex++] = 0x6D;
            addLocation(tempAdd.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x8D;
            addLocation(tempAdd.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
            /*
            */
        }
        else if (right.name === "[Addition]") {
            generaterRecurseExpression(right,tempAdd);
        }
    } else if (/^[a-z]$/.test(node.name)) {
        const ref = findScopeFromAST(node.name, node);
        if (!ref) throw new Error(`Var '${node.name}' not found`);
        code[codeIndex++] = 0xAD;
        addLocation(ref.name, codeIndex);
        code[codeIndex++] = 0x00;
        code[codeIndex++] = 0x00;
    }
}

function findScopeFromAST(varName: string, node: TreeNode): Static | undefined {
    let current: TreeNode | null = node;

    while (current !== null) {
        if (current.scopeId !== undefined) {
            const candidate = staticTable.find(entry => entry.name === `${varName}@${current.scopeId}`);
            if (candidate) return candidate;
        }
        current = current.parent;
    }

    return undefined;
}
export function generateCode(ast: Tree): number[] {




    function visit(node: TreeNode): void {
        //        console.log(`switch on ${node.name}`);

        switch (node.name) {

            case "[Program]":
            case "[Block]":
                //I want to enter and exit scope here like in scopeAnalyzer but I'll need to handle the base case
                for (const child of node.children) visit(child);
                break;
            case "[VariableDeclaration]": {
                let type = node.children[0].name;
                let id = node.children[1].name;
                let scope = node.scopeId
                switch (type) {
                    case "boolean":
                    case "int":
                        code[codeIndex++] = 0xA9;//load acc with const
                        code[codeIndex++] = 0x00;//initialize to zero
                        code[codeIndex++] = 0x8D; //store acc in memory
                        const newStatic = new Static(id, scope, 1); //create the static entry since this is a var decl
                        staticTable[staticIndex++] = newStatic;//add the static object to the static table
                        let name = `${id}@${scope}`
                        addLocation(name, codeIndex++)//update the locations this object holds
                        code[codeIndex++] = 0x00;
                        break;
                    case "string":
                        const stringStatic = new Static(id, scope)
                        staticTable[staticIndex++] = stringStatic;
                        break;
                }
                break;
            }
            case "[AssignmentStatement]": {
                const idNode = node.children[0];
                const valueNode = node.children[1];
                const target = findScopeFromAST(idNode.name, node);
                if (!target) throw new Error(`No static for ${idNode.name} from scope ${node.scopeId}`);

                if (/^".*"$/.test(valueNode.name)) { // string literal
                    const raw = valueNode.name.slice(1, -1);
                    target.stringValue = raw;

                }
                else if (idNode.type == "boolean") {

                }
                else if (/^\d+$/.test(valueNode.name)) { //single digit no addition
                    code[codeIndex++] = 0xA9;
                    code[codeIndex++] = parseInt(valueNode.name);
                    code[codeIndex++] = 0x8D;
                    addLocation(target.name,codeIndex);
                    code[codeIndex++] = 0x00;
                    code[codeIndex++] = 0x00;
                }
                else { //addition or id assignment
                    generateBaseExpression(valueNode);
                    code[codeIndex++] = 0x8D;
                    addLocation(target.name, codeIndex);
                    code[codeIndex++] = 0x00;
                    code[codeIndex++] = 0x00;
                    /*                   
                     */
                    
                }

                break;
            }
            case "[PrintStatement]": {
                const expr = node.children[0];

                if (/^".*"$/.test(expr.name)) {
                    const raw = expr.name.slice(1, -1);
                    const tempName = `_strlit@${codeIndex}`;
                    const tempStatic = new Static(tempName, 0);
                    tempStatic.stringValue = raw;
                    staticTable.push(tempStatic);

                    // Set up for SYS call
                    code[codeIndex++] = 0xA2; // LDX #$02 (print string)
                    code[codeIndex++] = 0x02;

                    code[codeIndex++] = 0xA0; // LDY tempStatic
                    addLocation(tempStatic.name, codeIndex);
                    code[codeIndex++] = 0x00;

                    code[codeIndex++] = 0xFF; // SYS
                }

                else if (/^[a-z]$/.test(expr.name)) {
                    if (expr.type == "string") {
                        const target = findScopeFromAST(expr.name, node);
                        if (!target) throw new Error(`No static for ${expr.name} from scope ${node.scopeId}`);

                        code[codeIndex++] = 0xA2; // LDX #$02 (print string)
                        code[codeIndex++] = 0x02;

                        code[codeIndex++] = 0xA0; // LDY <addr of var>
                        addLocation(target.name, codeIndex);
                        code[codeIndex++] = 0x00;

                        code[codeIndex++] = 0xFF; // SYS
                    }
                    else { //bool or int
                        const target = findScopeFromAST(expr.name, node);
                        code[codeIndex++] = 0xA2; // LDX #$02 (print string)
                        code[codeIndex++] = 0x01;

                        code[codeIndex++] = 0xAC; // LDY <addr of var>
                        addLocation(target.name, codeIndex);
                        code[codeIndex++] = 0x00;
                        code[codeIndex++] = 0x00;
                        code[codeIndex++] = 0xFF; // SYS

                    }
                }

                else {
                    throw new Error(`Unsupported print target: ${expr.name}`);
                }

                break;
            }




            default:
                for (const child of node.children) visit(child);
                break;

        }
    }
    function fillStatic() {
        for (const entry of staticTable) {
            if (entry.stringValue !== undefined) {
                entry.heapLocation = codeIndex;
                for (const char of entry.stringValue) {
                    code[codeIndex++] = char.charCodeAt(0);
                }
                code[codeIndex++] = 0x00; // null terminator
            } else if (entry.heapLocation === -1) {
                entry.heapLocation = codeIndex++;
            }

            for (const loc of entry.stackTargets) {
                code[loc] = entry.heapLocation;
            }
        }
    }

    if (ast.root) {
        visit(ast.root);
        code[codeIndex++] = 0x00; //BRK
        fillStatic();
    }


    return code;
}
