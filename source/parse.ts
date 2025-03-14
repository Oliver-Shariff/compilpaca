import { tokenize, Token, tokenType } from './lexer.js';
import { Tree } from './tree.js'; // Import the Tree class
class Parser {
    private tokens: Token[];
    private current: number = 0;
    private log: string[] = []; // Store logs here
    private cst: Tree;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.cst = new Tree();
    }


    /*Helper methods */

    private logMessage(type: string, message: string) {
        this.log.push(`<span class="${type}">${message}</span>`);
    }

    //look at current token
    private peek(): Token {
        return this.tokens[this.current];
    }

    //check for end of program with EOP
    private isAtEnd(): boolean {
        return this.peek().type === tokenType.EOP;
    }

    // get previous token
    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    //check token type without consuming it
    private check(type: tokenType): boolean {
        return this.peek().type === type;
    }

    //move to next token and return previous one
    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    //check current token and advance if type matches - return boolean
    private match(type: tokenType): boolean {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    //check current token and advance if type matches - return next token
    private consume(type: tokenType, message: string): Token {
        if (this.check(type)) {
            const token = this.advance();
            this.cst.addNode(token.value, "leaf");
            return token;
        }
        throw new Error(message);
    }



    /*Parsing methods */
    public parse(): { cst: any, logs: string[], pass: boolean } {
        try {
            this.logMessage("info", "INFO Parser - Starting parsing...");
            this.cst.addNode("Program", "branch");
            this.parseProgram();
            this.logMessage("success", "INFO Parser - Successfully parsed program!\n");
            this.cst.endChildren();
            return { cst: this.cst, logs: this.log, pass: true };
        } catch (error) {
            this.logMessage("error", `ERROR Parser - ${error.message}`);
            this.logMessage('fail', 'FAIL Parser - failed with 1 error');
            return { cst: null, logs: this.log, pass: false };
        }
    }

    private parseProgram(){
        this.logMessage("debug", "DEBUG Parser - Parsing Program")
        this.cst.addNode("Block", "branch");
        this.parseBlock();
        this.cst.endChildren();
        this.consume(tokenType.EOP, 'Expected end of program ($)');
    }

    private parseBlock(){
        this.logMessage("debug", "DEBUG Parser - Parsing block")
        this.consume(tokenType.LBRACE, 'Expected { at start of block');
        this.cst.addNode("StatementList", "branch");
        this.parseStatementList();
        this.cst.endChildren();
        this.consume(tokenType.RBRACE, 'Expected } at end of block');
        
    }

    private parseStatementList() {
        while (!this.check(tokenType.RBRACE) && !this.isAtEnd()) {
            this.parseStatement();
        }
    }

    private parseStatement(){
        //we can see what type of statement we have based on the first token
        this.logMessage("debug", "DEBUG Parser - Parsing Statement");
        if (this.check(tokenType.KEYWORD)) {
            let keyword = this.advance().value;
            this.cst.addNode(keyword, "branch");
            switch (keyword) {
                case "print":
                    this.parsePrintStatement();
                    break;
                case "while":
                    this.parseWhileStatement();
                    break;
                case "if":
                    this.parseIfStatement();
                    break;
                case "int":
                case "string":
                case "boolean":
                    this.parseVarDecl();
                    break;
            }
            this.cst.endChildren();
        } else if (this.match(tokenType.ID)) {
            this.cst.addNode("AssignmentStatement", "branch");
            this.parseAssignmentStatement();
            this.cst.endChildren();
        } else if (this.check(tokenType.LBRACE)) {
            this.parseBlock();
        } else {
            this.logMessage("error", `Unexpected token: ${this.peek().value}`);
        }
    }

    private parsePrintStatement() {
        this.consume(tokenType.LPAREN, "Expected ( after print");
        this.cst.addNode("Expression", "branch");
        this.parseExpression();
        this.cst.endChildren();
        this.consume(tokenType.RPAREN, "Expected ) after expression");
    }

    private parseAssignmentStatement() {
        this.consume(tokenType.ASSIGN, "Expected = in assignment");
        this.cst.addNode("Expression", "branch");
        this.parseExpression();
        this.cst.endChildren();
    }

    private parseVarDecl() {
        const id = this.consume(tokenType.ID, "Expected variable name");
        this.cst.addNode(`VarDecl (${id.value})`, "leaf");
    }

    private parseWhileStatement() {
        this.cst.addNode("WhileStatement", "branch");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseIfStatement() {
        this.cst.addNode("IfStatement", "branch");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseExpression() {
        if (this.match(tokenType.NUMBER)) {
            this.cst.addNode("IntExpression", "leaf");
        } else if (this.match(tokenType.QUOTE)) {
            this.parseStringExpr();
        } else if (this.match(tokenType.BOOL)) {
            this.cst.addNode("BooleanLiteral", "leaf");
        } else if (this.match(tokenType.LPAREN)) {
            this.parseBooleanExpr();
        } else if (this.match(tokenType.ID)) {
            this.cst.addNode("Identifier", "leaf");
        } else {
            this.logMessage("error", `Unexpected token: ${this.peek().value}`);
        }
    }

    private parseBooleanExpr() {
        this.consume(tokenType.LPAREN, "Expected ( in boolean expression");
        this.cst.addNode("BooleanExpression", "branch");
        this.parseExpression();
        this.consume(tokenType.EQUALITY, "Expected == or != in boolean expression");
        this.parseExpression();
        this.consume(tokenType.RPAREN, "Expected ) in boolean expression");
        this.cst.endChildren();
    }

    private parseStringExpr(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing string expression")
        const chars = [];
        while (!this.match(tokenType.QUOTE)) {
            if (this.match(tokenType.CHAR) || this.match(tokenType.SPACE)) {
                chars.push(this.previous().value);
            } else {
                this.logMessage('error', `Unexpected token: ${this.peek().value}`);
                return null;
            }
        }
        return { type: 'StringLiteral', value: chars.join('') };
    }
}//class boundary

export function parse(tokens: Token[]): { cst: Tree, logs: string[], pass: boolean } {
    const parser = new Parser(tokens);
    return parser.parse();
}