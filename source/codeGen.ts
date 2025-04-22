import { Tree, TreeNode } from './tree.js';
import { Scope } from './scopeAnalyzer.js';


class Static {
    temp: number;
    var: string;
    address: number;
}

export function generateCode(ast: Tree, scopeTree: Scope): number[] {
    const staticTable: Static[] = []
    const code: number[] = new Array(256).fill(0x00);
    let currentIndex = 0;

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
                        code[currentIndex++] = 0xA9;
                        code[currentIndex++] = 0x00;
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
