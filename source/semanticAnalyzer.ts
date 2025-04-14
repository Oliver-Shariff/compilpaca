import { Tree, TreeNode } from './tree.js';

export function buildAST(cst: Tree): Tree {
    const ast = new Tree("ast");

    if (!cst.root) return ast;

    function visit(node: TreeNode, astTree: Tree): void {
        console.log("visiting node " + node.name);
        switch (node.name) {
            case "[Program]":
                astTree.addNode("[Program]", "branch");
                for (const child of node.children) {
                    visit(child, astTree);
                }
                astTree.endChildren();
                break;
            case "[Block]":
                astTree.addNode("[Block]", "branch");
                for (const child of node.children) {
                    visit(child, astTree);
                }
                astTree.endChildren();
                break;

            case "[VarDecl]": {
                const type = node.children[0]?.children[0]?.name;
                const id = node.children[1]?.children[0]?.children[0].name;
                if (type && id) {
                    astTree.addNode("[VariableDeclaration]", "branch");
                    astTree.addNode(type, "leaf");
                    astTree.addNode(id, "leaf");
                    astTree.endChildren();
                }
                break;
            }

            case "[AssignmentStatement]": {
                const id = node.children[0]?.children[0]?.children[0]?.name;
                const exprNode = node.children[2];
                if (id && exprNode) {
                    astTree.addNode("[AssignmentStatement]", "branch");
                    astTree.addNode(id, "leaf");
                    visit(exprNode, astTree);  // delegate to expression
                    astTree.endChildren();
                }
                break;
            }

            case "[IntExpression]": {
                const digit = node.children[0]?.children[0]?.name;
                if (digit) {
                    astTree.addNode(digit, "leaf");
                    astTree.endChildren();
                }
                break;
            }
            case "[PrintStatement]": {
                astTree.addNode("[PrintStatment]", "branch");

                // Locate the expression (3rd child in CST)
                const exprNode = node.children[2];

                // Handle the expression (expecting a StringExpression)
                if (exprNode?.name === "[Expression]") {
                    const stringExpr = exprNode.children[0];
                    if (stringExpr?.name === "[StringExpression]") {
                        const charListNode = stringExpr.children[1]; // after opening quote
                        const strValue = extractString(charListNode); //helper function handles charlist
                        astTree.addNode(strValue, "leaf");
                    }
                }

                astTree.endChildren();
                break;
            }
            case "[WhileStatement]": {
                astTree.addNode("[WhileStatement]", "branch");

                const boolExpr = node.children[1];
                if (boolExpr?.name === "[BooleanExpression]") {

                    // boolean expression as condition
                    if (boolExpr.children.length >= 4) {
                        const leftExpr = boolExpr.children[1];
                        const boolOp = boolExpr.children[2];
                        const rightExpr = boolExpr.children[3];

                        if (leftExpr?.name === "[Expression]") visit(leftExpr, astTree);
                        const op = boolOp?.children[0]?.name;
                        if (op) astTree.addNode(op, "leaf");
                        if (rightExpr?.name === "[Expression]") visit(rightExpr, astTree);
                    }

                    // boolval as condition
                    else if (boolExpr.children[0]?.name === "[BooleanValue]") {
                        const value = boolExpr.children[0]?.children[0]?.name;
                        if (value) astTree.addNode(value, "leaf");
                    }

                }

                // Handle the body block
                const body = node.children[2];
                if (body?.name === "[Block]") {
                    visit(body, astTree);
                }

                astTree.endChildren(); // end <WhileStatement>
                break;
            }


            default:
                for (const child of node.children) {
                    visit(child, astTree);
                }
                break;
        }
    }
    function extractString(charListNode: TreeNode | undefined): string {
        let result = "";

        let current = charListNode;
        while (current && current.name === "[CharList]") {
            const charNode = current.children[0]; // [CHAR]
            const valueNode = charNode?.children[0]; // actual character
            if (valueNode?.name) {
                result += valueNode.name;
            }
            // descend into next CharList
            current = current.children[1]; // nested CharList
        }

        return result;
    }


    visit(cst.root, ast);
    return ast;
}
