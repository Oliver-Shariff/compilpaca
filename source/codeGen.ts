import { Tree, TreeNode } from './tree.js';
import { Scope } from './scopeAnalyzer.js';


class Static {
    name: string;
    id: string; //variable name
    scope: number;
    size: number; //not using length to avoid static.length vs static[].length confusion
    locations: number[] = []
    value: number;
    
    constructor(id: string, scope: number, size: number, value: number) {
        this.id = id;
        this.scope = scope;
        this.size = size;
        this.name = `${id}@${scope}`; //for clean debug
        this.value = value;
    }
    
}

function staticEntry(id: string, scope: number, size: number) {
    
}

const staticTable: Static[] = []


export function generateCode(ast: Tree, rootScope: Scope): number[] {
    const code: number[] = new Array(256).fill(0x00);
    let codeIndex = 0;
    let staticIndex = 0;
    let currentScope = rootScope;
    
    function gotoChild(){
        //which child?
    }
    function gotoParent(){
        
    }
    
    function visit(node: TreeNode): void {
        console.log(`switch on ${node.name}`);
        switch (node.name) {

            case "[Program]":
            case "[Block]":
                //I want to enter and exit scope here like in scopeAnalyzer but I'll need to handle the base case
                for (const child of node.children) visit(child);
                break;
            case "[VariableDeclaration]": {
                let type = node.children[0].name;
                console.log(`switch on ${type}`);
                switch (type) {
                    case "int":
                        code[codeIndex++] = 0xA9;
                        code[codeIndex++] = 0x00;
                        break;
                }
                break;
            }
            default:
                break;
        }
    }

    if (ast.root) {
        visit(ast.root);
    }


    return code;
}
