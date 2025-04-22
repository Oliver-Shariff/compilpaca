import { Tree, TreeNode } from './tree.js';
import { Scope } from './scopeAnalyzer.js';


class Static {
    temp: number;
    id: string;
    address: number;

    constructor(temp: number, id: string, address: number) {
        this.temp = temp;
        this.id = id;
        this.address = address;
    }

}
const staticTable: Static[] = []



function staticEntry() {
    if (staticTable.length == 0) {
        const newStatic = new Static()

    }
    else {

    }
}

export function generateCode(ast: Tree, scopeTree: Scope): number[] {
    const code: number[] = new Array(256).fill(0x00);
    let codeIndex = 0;
    let staticIndex = 0;

    function visit(node: TreeNode): void {
        console.log(`switch on ${node.name}`);
        switch (node.name) {

            case "[Program]":
            case "[Block]":
                for (const child of node.children) visit(child);
                break;
            case "[VariableDeclaration]": {
                let type = node.children[0].name;
                console.log(`switch on ${type}`);
                switch (type) {
                    case "int":
                        code[codeIndex++] = 0xA9;
                        code[codeIndex++] = 0x00;
                        const newStatic = new Static(staticIndex++, node.children[1].name, 0)

                        staticTable[staticIndex] = newStatic
                        console.log(
                            staticTable[staticTable.length-1].id);
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
