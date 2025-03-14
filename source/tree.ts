class TreeNode {
    name: string;
    children: TreeNode[];
    parent: TreeNode | null;

    constructor(name: string, parent: TreeNode | null = null) {
        this.name = name;
        this.children = [];
        this.parent = parent;
    }
}

class Tree {
    root: TreeNode | null;
    cur: TreeNode | null;

    constructor() {
        this.root = null;
        this.cur = null;
    }

    addNode(name: string, kind: "branch" | "leaf"): void {
        const node = new TreeNode(name, this.cur);

        if (!this.root) {
            this.root = node;
        } else if (this.cur) {
            this.cur.children.push(node);
        }

        if (kind === "branch") {
            this.cur = node;
        }
    }

    endChildren(): void {
        if (this.cur?.parent) {
            this.cur = this.cur.parent;
        }
    }

    toString(): string {
        let traversalResult = "";

        const expand = (node: TreeNode, depth: number): void => {
            traversalResult += "-".repeat(depth);
            if (node.children.length === 0) {
                traversalResult += `[${node.name}]\n`;
            } else {
                traversalResult += `<${node.name}> \n`;
                node.children.forEach(child => expand(child, depth + 1));
            }
        };

        if (this.root) {
            expand(this.root, 0);
        }
        
        return traversalResult;
    }
}

export { Tree, TreeNode };
