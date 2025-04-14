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
                    visit(exprNode, astTree);  // can be any type of expr
                    astTree.endChildren();
                }
                break;
            }
            case "[BooleanExpression]": {
                // expr
                if (node.children.length >= 4) {
                    const leftExpr = node.children[1];
                    const boolOp = node.children[2];
                    const rightExpr = node.children[3];

                    const op = boolOp?.children[0]?.name;
                    const opLabel = op === "==" ? "[Equals]" : "[NotEquals]";
                    astTree.addNode(opLabel, "branch");

                    if (leftExpr?.name === "[Expression]") visit(leftExpr, astTree);
                    if (rightExpr?.name === "[Expression]") visit(rightExpr, astTree);

                    astTree.endChildren(); // end Equals/NotEquals
                }

                // boolval
                else if (node.children[0]?.name === "[BooleanValue]") {
                    const value = node.children[0]?.children[0]?.name;
                    if (value) astTree.addNode(value, "leaf");
                }

                break;
            }
            case "[StringExpression]": {
                const charListNode = node.children[1]; // skip opening quote
                const strValue = extractString(charListNode);
                if (strValue) {
                    astTree.addNode(`"${strValue}"`, "leaf");
                }
                break;
            }

            case "[IntExpression]": {
                const digitNode = node.children[0];
                const opNode = node.children[1];
                const exprNode = node.children[2];

                // Simple digit with no operation
                if (!opNode && digitNode?.name === "[Digit]") {
                    const value = digitNode.children[0]?.name;
                    if (value) astTree.addNode(value, "leaf");
                    break;
                }

                // Addition
                if (
                    digitNode?.name === "[Digit]" &&
                    opNode?.name === "[Intger Operation]" &&
                    opNode.children[0]?.name === "+"
                ) {
                    astTree.addNode("[Addition]", "branch");

                    const leftValue = digitNode.children[0]?.name;
                    if (leftValue) {
                        astTree.addNode(leftValue, "leaf");
                    }

                    if (exprNode?.name === "[Expression]") {
                        visit(exprNode, astTree); // recursion allows for multiple additions
                    }

                    astTree.endChildren();
                    break;
                }

                break;
            }



            case "[PrintStatement]": {
                astTree.addNode("[PrintStatement]", "branch");

                // skip "print" and "("
                const exprNode = node.children[2];
                if (exprNode?.name === "[Expression]") {
                    visit(exprNode, astTree);
                }

                astTree.endChildren();
                break;
            }

            case "[WhileStatement]": {
                astTree.addNode("[WhileStatement]", "branch");

                const boolExpr = node.children[1];
                if (boolExpr?.name === "[BooleanExpression]") {

                    // boolexpr
                    if (boolExpr.children.length >= 4) {
                        const leftExpr = boolExpr.children[1];
                        const boolOp = boolExpr.children[2];
                        const rightExpr = boolExpr.children[3];

                        const op = boolOp?.children[0]?.name;
                        if (op) {
                            astTree.addNode(op === "==" ? "[Equals]" : "[NotEquals]", "branch"); // if == then [equals] else [NotEquals]

                            //  Nest the values directly into Equals
                            if (leftExpr?.name === "[Expression]") visit(leftExpr, astTree);
                            if (rightExpr?.name === "[Expression]") visit(rightExpr, astTree);

                            astTree.endChildren(); // close Equals/NotEquals
                        }
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

                astTree.endChildren(); // close <WhileStatement>
                break;
            }
            case "[IfStatement]": {
                astTree.addNode("[IfStatement]", "branch");

                const boolExpr = node.children[1];
                if (boolExpr?.name === "[BooleanExpression]") {

                    // boolexper
                    if (boolExpr.children.length >= 4) {
                        const leftExpr = boolExpr.children[1];
                        const boolOp = boolExpr.children[2];
                        const rightExpr = boolExpr.children[3];

                        const op = boolOp?.children[0]?.name;
                        if (op) {
                            astTree.addNode(op === "==" ? "[Equals]" : "[NotEquals]", "branch"); // if == then [equals] else [NotEquals]

                            //  Nest the values directly into Equals
                            if (leftExpr?.name === "[Expression]") visit(leftExpr, astTree);
                            if (rightExpr?.name === "[Expression]") visit(rightExpr, astTree);

                            astTree.endChildren(); // close Equals/NotEquals
                        }
                    }

                    // boolval
                    else if (boolExpr.children[0]?.name === "[BooleanValue]") {
                        const value = boolExpr.children[0]?.children[0]?.name;
                        if (value) astTree.addNode(value, "leaf");
                    }
                }

                // Visit the if block body
                const body = node.children[2];
                if (body?.name === "[Block]") {
                    visit(body, astTree);
                }

                astTree.endChildren(); // close IfStatement
                break;
            }
            case "[Expression]": {
                const inner = node.children[0];
                if (inner) visit(inner, astTree); // match the type of expression and call that
                break;
            }

            case "[Id]": {
                const char = node.children[0]?.children[0]?.name;
                if (char) astTree.addNode(char, "leaf");
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
