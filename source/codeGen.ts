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
    aliasOf?: string;

    constructor(id: string, scope: number, size?: number) {
        this.id = id;
        this.scope = scope;
        this.size = size;
        this.name = `${id}@${scope}`; //for clean debug

    }

}
class Jump {
    id: number;
    amount: number;
    codeLocation: number;

    constructor(id: number, codeLocation: number) {
        this.id = id;
        this.codeLocation = codeLocation;
    }
}

const staticTable: Static[] = []
const code: number[] = new Array(256).fill(0x00);
let codeIndex = 0;
let staticIndex = 0;
let tempCounter = 0;
let jumpTableindex = 0;
const jumpTable: Jump[] = []



function addLocation(name: string, location: number) {
    for (let i = 0; i < staticTable.length; i++) {
        if (staticTable[i].name == name) {
            staticTable[i].stackTargets.push(location);
        }
    }
}

function generateBaseExpression(node: TreeNode): void {
    console.log("generateBaseExpression called");
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
        else if (/^[a-z]$/.test(right.name)) {
            console.log("right side is var");
            const ref = findScopeFromAST(right.name, node);
            if (!ref) throw new Error(`Var '${node.name}' not found`);
            code[codeIndex++] = 0xAD;
            addLocation(ref.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x6D;
            addLocation(tempAdd.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
        }
        else if (right.name === "[Addition]") {
            generaterRecurseExpression(right, tempAdd);
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
    console.log("recuse Expr called");
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
        else if (/^[a-z]$/.test(right.name)) {
            console.log("right side is var");
            const ref = findScopeFromAST(right.name, node);
            if (!ref) throw new Error(`Var '${node.name}' not found`);
            code[codeIndex++] = 0xAD;
            addLocation(ref.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x6D;
            addLocation(tempAdd.name, codeIndex);
            code[codeIndex++] = 0x00;
            code[codeIndex++] = 0x00;
        }
        else if (right.name === "[Addition]") {
            generaterRecurseExpression(right, tempAdd);
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
                else if (idNode.type == "boolean" && !(/^[a-z]$/.test(valueNode.name))) {
                    if (valueNode.name === "[NotEquals]") {

                    }
                    code[codeIndex++] = 0xA9;
                    if (/(true)/.test(valueNode.name)) {
                        code[codeIndex++] = 0x01;
                    }
                    else {
                        code[codeIndex++] = 0x00;
                    }
                    code[codeIndex++] = 0x8D;
                    addLocation(target.name, codeIndex);
                    code[codeIndex++] = 0x00;
                    code[codeIndex++] = 0x00;


                }
                else if (/^\d+$/.test(valueNode.name)) { //single digit no addition
                    code[codeIndex++] = 0xA9;
                    code[codeIndex++] = parseInt(valueNode.name);
                    code[codeIndex++] = 0x8D;
                    addLocation(target.name, codeIndex);
                    code[codeIndex++] = 0x00;
                    code[codeIndex++] = 0x00;
                }
                else if (idNode.type == "string") {
                    const source = findScopeFromAST(valueNode.name, node);
                    if (!source) throw new Error(`Source '${valueNode.name}' not found`);
                    target.aliasOf = source.name;
                }
                else { //addition or id assignment
                    generateBaseExpression(valueNode);
                    code[codeIndex++] = 0x8D;
                    addLocation(target.name, codeIndex);
                    code[codeIndex++] = 0x00;
                    code[codeIndex++] = 0x00;
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
            case "[IfStatement]": {
                //boolExpr left
                //boolval
                //OR
                //Equals | NotEquals
                //block right
                let boolExpr = node.children[0];
                let block = node.children[1];

                if (/(true)/.test(boolExpr.name)) {
                    visit(block);
                }
                else if (/(false)/.test(boolExpr.name)) {
                    //do nothing - skip block 
                }
                else if (boolExpr.name === "[NotEquals]" || boolExpr.name === "[Equals]") {
                    let left = boolExpr.children[0];
                    let right = boolExpr.children[1];
                    const leftRef = findScopeFromAST(left.name, node);
                    const rightRef = findScopeFromAST(right.name, node);
                    if (left.name === "[NotEquals]" || left.name === "[Equals]") {
                        visit(left);
                    }
                    if (right.name === "[NotEquals]" || right.name === "[Equals]") {
                        visit(right);
                    }
                    else if (!(/^".*"$/.test(left.name)) || !(/^".*"$/.test(right.name))) { //no string literal
                        if (left.type != "string") { //don't have to check right due to type checking
                            code[codeIndex++] = 0xAE;
                            if (!leftRef) throw new Error(`Undeclared variable '${left.name}'`);
                            addLocation(leftRef.name, codeIndex);
                            code[codeIndex++] = 0x00;
                            code[codeIndex++] = 0x00;
                            code[codeIndex++] = 0xEC;
                            if (!rightRef) throw new Error(`Undeclared variable '${right.name}'`);
                            addLocation(rightRef.name, codeIndex);
                            code[codeIndex++] = 0x00;
                            code[codeIndex++] = 0x00;
                            //now Z flag is set

                            // Reserve slot for D0 jump offset (skip block logic)
                            const branchIndex = codeIndex;
                            code[codeIndex++] = 0xD0;
                            code[codeIndex++] = 0x00; // placeholder for offset

                            const blockStart = codeIndex;
                            visit(block);
                            const blockEnd = codeIndex;
                            const offset = blockEnd - branchIndex - 2;

                            // For [Equals], Z flag = 1 no skip, Z flag = 0 skip
                            // For [NotEquals], Z flag = 1 skip, Z flag = 0 no skip

                            if (boolExpr.name === "[Equals]") {
                                code[branchIndex + 1] = offset;
                            }
                            else if (boolExpr.name === "[NotEquals]") {
                            }
                        }
                        else if (left.type == "string") {
                            console.log("both sides are string")
                            if ((/^".*"$/.test(left.name)) || (/^".*"$/.test(right.name))) {
                                //do nothing, always false, we cannot check structure
                            }
                            else {// both are string variables
                                if (leftRef.name == rightRef.aliasOf || rightRef.name == leftRef.aliasOf) {
                                    if (boolExpr.name === "[Equals]") {
                                        visit(block);
                                    }
                                }
                                if (leftRef.name != rightRef.aliasOf && rightRef.name != leftRef.aliasOf) {
                                    if (boolExpr.name === "[NotEquals]") {
                                        visit(block);
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            }
            case "[WhileStatement]": {
                //boolExpr left
                //boolval
                //OR
                //Equals | NotEquals
                //block right
                let boolExpr = node.children[0];
                let block = node.children[1];

                if (/(true)/.test(boolExpr.name)) {
                    //infinite loop
                    const loopStart = codeIndex;
                    visit(block);
                    code[codeIndex++] = 0xD0;
                    code[codeIndex++] = 256 - (codeIndex - loopStart);
                }
                else if (/(false)/.test(boolExpr.name)) {
                    //do nothing - skip block 
                    break;
                }
                else if (boolExpr.name === "[NotEquals]" || boolExpr.name === "[Equals]") {
                    let left = boolExpr.children[0];
                    let right = boolExpr.children[1];
                    const leftRef = findScopeFromAST(left.name, node);
                    const rightRef = findScopeFromAST(right.name, node);
                    if (left.name === "[NotEquals]" || left.name === "[Equals]") {
                        visit(left);
                    }
                    if (right.name === "[NotEquals]" || right.name === "[Equals]") {
                        visit(right);
                    }
                    else if (!(/^".*"$/.test(left.name)) || !(/^".*"$/.test(right.name))) { //no string literal
                      
                        if (left.type != "string") { //don't have to check right due to type checking

                            // For [Equals], Z flag = 1 no skip, Z flag = 0 skip
                            // For [NotEquals], Z flag = 1 skip, Z flag = 0 no skip

                            if (boolExpr.name === "[Equals]") {
                                // Load left into X
                                code[codeIndex++] = 0xAE;
                                addLocation(leftRef.name, codeIndex);
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0x00;

                                // Compare right to X (sets Z if equal)
                                code[codeIndex++] = 0xEC;
                                addLocation(rightRef.name, codeIndex);
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0x00;

                                // Branch if not equal — skip block and loop
                                const branchToEndIndex = codeIndex;
                                code[codeIndex++] = 0xD0;
                                const placeholderIndex = codeIndex++;

                                const blockStart = codeIndex;
                                visit(block);

                                // Unconditional branch back to top
                                //Manually set z flag here to trigger abs jump
                                code[codeIndex++] = 0xD0;
                                const backOffset = (256 + loopStart - (codeIndex + 1)) % 256;
                                code[codeIndex++] = backOffset;

                                // Fill in skip offset
                                const blockEnd = codeIndex;
                                const skipOffset = blockEnd - (branchToEndIndex + 2);
                                code[placeholderIndex] = skipOffset;

                            }

                            else if (boolExpr.name === "[NotEquals]") {

                                /*
                                Steps
                                check condition, load left into x
                                compare x to right
                                equal --> break loop | Z flag is set to 1
                                not equal -->  run loop | Z flag is set to 0
                                
                                we can only branch on zero
                                
                                what if I write the loop block first, with a branch to go after it and check the loop header
                                not equal --> z flag is 0 --> branch backwards
                                equal --> z flag  is 1 --> don't branch backwards
                                
                                */

                                //code that forces branch after loop block 
                                const tempZClear = new Static(`_zero${codeIndex}`, 0);
                                staticTable[staticIndex++] = tempZClear;
                                code[codeIndex++] = 0xA9;
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0x8D;
                                addLocation(tempZClear.name, codeIndex); 
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0xA2;
                                code[codeIndex++] = 0x01;
                                code[codeIndex++] = 0xEC;
                                addLocation(tempZClear.name, codeIndex); 
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0x00;
                                code[codeIndex++] = 0xD0;
                                const jump1 = new Jump(codeIndex, codeIndex);
                                jumpTable[jumpTableindex++] = jump1;
                                code[codeIndex++] = 0x00;
                                const loopStart = codeIndex;

                                visit(block); // emit code for loop body
                                console.log(`right name: ${right.name}`)

                                jump1.amount = codeIndex - jump1.codeLocation -1;

                                // Load left into X
                                if (leftRef) {
                                    code[codeIndex++] = 0xAE; // LDX <left>
                                    addLocation(leftRef.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;
                                } else if (/^\d+$/.test(left.name)) {
                                    code[codeIndex++] = 0xA2; // LDX #literal
                                    code[codeIndex++] = parseInt(left.name);
                                }
                                else if(/(true)/.test(left.name)){ //boolean literal
                                    code[codeIndex++] = 0xA2; // LDX #literal
                                    code[codeIndex++] = 0x01; // LDX #literal
                                }
                                else if(/(false)/.test(left.name)){ //boolean literal
                                    code[codeIndex++] = 0xA2; // LDX #literal
                                    code[codeIndex++] = 0x00; // LDX #literal
                                }

                                // Compare X to right
                                if (rightRef) {
                                    code[codeIndex++] = 0xEC; // CPX <right>
                                    addLocation(rightRef.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;
                                } else if (/^\d+$/.test(right.name)) {
                                    const temp = new Static(`_temp${codeIndex}`, node.scopeId);
                                    staticTable.push(temp);

                                    code[codeIndex++] = 0xA9; // LDA #right literal
                                    code[codeIndex++] = parseInt(right.name);
                                    code[codeIndex++] = 0x8D; // STA temp
                                    addLocation(temp.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;

                                    code[codeIndex++] = 0xEC; // CPX temp
                                    addLocation(temp.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;
                                }
                                else if(/(true)/.test(right.name)){ //boolean literal
                                    const temp = new Static(`_temp${codeIndex}`, node.scopeId);
                                    staticTable.push(temp);

                                    code[codeIndex++] = 0xA9; // LDA #right literal
                                    code[codeIndex++] = 0x01
                                    code[codeIndex++] = 0x8D; // STA temp
                                    addLocation(temp.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;

                                    code[codeIndex++] = 0xEC; // CPX temp
                                    addLocation(temp.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;
                                }
                                else if(/(false)/.test(right.name)){ //boolean literal
                                    const temp = new Static(`_temp${codeIndex}`, node.scopeId);
                                    staticTable.push(temp);

                                    code[codeIndex++] = 0xA9; // LDA #right literal
                                    code[codeIndex++] = 0x00
                                    code[codeIndex++] = 0x8D; // STA temp
                                    addLocation(temp.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;

                                    code[codeIndex++] = 0xEC; // CPX temp
                                    addLocation(temp.name, codeIndex);
                                    code[codeIndex++] = 0x00;
                                    code[codeIndex++] = 0x00;
                                }

                                //Branch if Not Equal (Z = 0)
                                const branchBack = codeIndex;
                                code[codeIndex++] = 0xD0; // BNE
                                const offset = (256 + loopStart - (codeIndex + 1)) % 256;
                                code[codeIndex++] = offset;
                            }
                        }
                      
                        else if (left.type == "string") {
                            if ((/^".*"$/.test(left.name)) || (/^".*"$/.test(right.name))) {
                                //do nothing, always false, we cannot check structure of string literals
                                break;
                            }
                            else {// both are string variables
                                if (leftRef.name == rightRef.aliasOf || rightRef.name == leftRef.aliasOf) {
                                    if (boolExpr.name === "[Equals]") {
                                        visit(block);
                                    }
                                }
                                if (leftRef.name != rightRef.aliasOf && rightRef.name != leftRef.aliasOf) {
                                    if (boolExpr.name === "[NotEquals]") {
                                        visit(block);
                                    }
                                }
                            }
                        }
                    }
                }


                break;
            }

            default:
                for (const child of node.children) visit(child);
                break;

        }
    }
    function backpatchJumps() {
        for (const entry of jumpTable) {
            code[entry.codeLocation] = entry.amount;
        }
    }

    function fillStatic() {
        for (const entry of staticTable) {
            // Step 1: Resolve alias
            if (entry.aliasOf) {
                const source = staticTable.find(e => e.name === entry.aliasOf);
                if (!source) throw new Error(`Alias target '${entry.aliasOf}' not found`);
                entry.heapLocation = source.heapLocation;
            }

            // Step 2: Allocate string if not yet resolved
            if (entry.heapLocation === -1) {
                if (entry.stringValue !== undefined) {
                    entry.heapLocation = codeIndex;
                    for (const char of entry.stringValue) {
                        code[codeIndex++] = char.charCodeAt(0);
                    }
                    code[codeIndex++] = 0x00;
                } else {
                    entry.heapLocation = codeIndex++;
                }
            }

            // Step 3: Back-patch stack targets
            for (const loc of entry.stackTargets) {
                code[loc] = entry.heapLocation;
            }
        }
    }


    if (ast.root) {
        visit(ast.root);
        code[codeIndex++] = 0x00; //BRK
        backpatchJumps();
        fillStatic();
    }
console.log(staticTable)

    return code;
}
