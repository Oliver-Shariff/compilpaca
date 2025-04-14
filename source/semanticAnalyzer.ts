import { Tree, TreeNode } from './tree.js';

export function buildAST(cst: Tree): Tree {
    const ast = new Tree("ast");

    if (!cst.root) return ast;

    function visit(node: TreeNode, astTree: Tree): void {
        console.log("visiting node " + node.name);
        switch (node.name) {
            case "[Program]":
            case "[Block]":
                astTree.addNode("Block", "branch");
                for (const child of node.children) {
                    visit(child, astTree);
                }
                astTree.endChildren();
                break;

            case "[VarDecl]": {
                const type = node.children[0]?.children[0]?.name;
                const id = node.children[1]?.children[0]?.name;
                if (type && id) {
                    astTree.addNode("VariableDeclaration", "branch");
                    astTree.addNode(type, "leaf");
                    astTree.addNode(id, "leaf");
                    astTree.endChildren();
                }
                break;
            }

            case "[AssignmentStatement]": {
                const id = node.children[0]?.children[0]?.name;
                const exprNode = node.children[2];
                if (id && exprNode) {
                    astTree.addNode("AssignmentStatement", "branch");
                    astTree.addNode(id, "leaf");
                    visit(exprNode, astTree);  // delegate to expression
                    astTree.endChildren();
                }
                break;
            }

            case "[IntExpression]": {
                const digit = node.children[0]?.children[0]?.name;
                if (digit) {
                    astTree.addNode("IntLiteral", "branch");
                    astTree.addNode(digit, "leaf");
                    astTree.endChildren();
                }
                break;
            }

            default:
                for (const child of node.children) {
                    visit(child, astTree);
                }
                break;
        }
    }

    visit(cst.root, ast);
    return ast;
}
