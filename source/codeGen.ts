import { Tree, TreeNode } from './tree.js';
import { Scope } from './scopeAnalyzer.js';


class Static {
    name: string;
    id: string; //variable name
    scope: number;
    size: number; //not using length to avoid static.length vs static[].length confusion
    locations: number[] = [] //all the target locations in code array that need to be overwritten
    value: number; // the actual mem location of the variable
    
    constructor(id: string, scope: number, size?: number) {
        this.id = id;
        this.scope = scope;
        this.size = size;
        this.name = `${id}@${scope}`; //for clean debug

    }
    
}
function addLocation(name: string, location: number){
    for (let i = 0; i < staticTable.length; i++ ){
        if (staticTable[i].name == name){
            staticTable[i].locations.push(location);
        }
    }


}

const staticTable: Static[] = []


export function generateCode(ast: Tree): number[] {
    const code: number[] = new Array(256).fill(0x00);
    let codeIndex = 0;
    let staticIndex = 0;
    
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
                        const newStatic = new Static(id,scope, 1); //create the static entry since this is a var decl
                        staticTable[staticIndex++] = newStatic;//add the static object to the static table
                        let name = `${id}@${scope}`
                        addLocation(name,codeIndex++)//update the locations this object holds
                        code[codeIndex++] = 0x00;
                        break;
                    case "string":
                        const stringStatic = new Static(id,scope)
                        staticTable[staticIndex++] = stringStatic;
                        break;
                }
                break;
            }
            default:
                break;
        }
    }
    function fillStatic(){
        for(let i = 0; i < staticTable.length; i++){//for every entry in the static table
            //I need to add logic here to handle strings which are longer than 1 location
            staticTable[i].value = codeIndex++;// after visit is over this will be the first free location
            for(let j = 0; j < staticTable[i].locations.length; j++){//at each target location saved
                code[staticTable[i].locations[j]] = staticTable[i].value; //write the value at the target location
            }
        }
    }

    if (ast.root) {
        visit(ast.root);
        fillStatic();
    }


    return code;
}
