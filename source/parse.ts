import { tokenize, Token, tokenType } from './lexer.js';
import { Tree } from './tree.js';

class Parser {
    private tokens: Token[];
    private current: number = 0;
    private log: string[] = []; // Store logs here
    private cst: Tree;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.cst = new Tree("cst");
    }

    /*Helper methods */

    private logMessage(type: string, message: string) { //type here is css class for formatting
        if(type == "debug" ||type == "error" ){
            this.log.push(`<span class="${type}"> ${message} | line: ${this.peek().line} col: ${this.peek().column}</span>`)
        }
        else{
            this.log.push(`<span class="${type}">${message}</span>`);
        }
    }

    //look at current token
    private peek(): Token {
        return this.tokens[this.current];
    }

    //check for end with EOP
    private isAtEnd(): boolean {
        return this.peek().type === tokenType.EOP;
    }

    //get previous token
    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    //check token without consuming it
    private check(type: tokenType): boolean {
        return this.peek().type === type;
    }

    //move to next token and return previous one
    private advance(): Token {
        this.current++;
        return this.previous();
    }

    //check current token, advance and return next token
    private consume(type: tokenType, message: string): Token {
        if (this.check(type)) {
            const token = this.advance();
            //console.log("Consumed: " + token.value)
            this.cst.addNode(token.value, "leaf", token.line, token.column);
            return token;
        }
        throw new Error(message);
    }

    /*Parsing methods */

    public parse(): { cst: any, logs: string[], pass: boolean } {
        try {
            this.parseProgram();
            this.logMessage("success", "INFO Parser - Successfully parsed program! \n");
            return { cst: this.cst, logs: this.log, pass: true };
        } catch (error) {
            this.logMessage("error", `ERROR Parser - ${error.message}`);
            this.logMessage('fail', 'FAIL Parser - failed with 1 error \n');
            return { cst: null, logs: this.log, pass: false };
        }
    }

    private parseProgram() {
        this.logMessage("debug", "DEBUG Parser - Parsing Program at line: ");
        this.cst.addNode("[Program]", "branch");
        this.parseBlock();
        this.cst.endChildren();
        this.consume(tokenType.EOP, "Expected end of program ($)");

    }



    private parseBlock() {
        this.logMessage("debug", "DEBUG Parser - Parsing Block");
        this.cst.addNode("[Block]", "branch");

        this.consume(tokenType.LBRACE, "Expected { at start of block");
        this.parseStatementList();
        this.consume(tokenType.RBRACE, "Expected } at end of block");
        this.cst.endChildren();

    }



    private parseStatementList() {
        this.cst.addNode("[StatementList]", "branch");
        this.logMessage("debug", "DEBUG Parser - Parsing Statement List")
        while (!this.check(tokenType.RBRACE) && !this.isAtEnd()) {
            this.parseStatement();
        }
        this.cst.endChildren();

    }

    private parseStatement() {
        //we can see what type of statement we have based on the first token
        this.logMessage("debug", "DEBUG Parser - Parsing Statement")
        this.cst.addNode("[Statement]", "branch");
        if (this.check(tokenType.KEYWORD)) {
            let keyword = this.peek().value;
            switch (keyword) {//this could be cleaner with multiple if statements but this is readable
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
        } else if (this.check(tokenType.ID)) {
            this.parseAssignmentStatement();
        } else if (this.check(tokenType.LBRACE)) {
            this.parseBlock();
        }
        else{
            throw new Error(`Expected statement, found [${this.peek().value}]`);
        }
        this.cst.endChildren();
    }

    private parsePrintStatement() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Print Statement")
        this.cst.addNode("[PrintStatement]", "branch", line, column);
        this.consume(tokenType.KEYWORD, 'Expected [print]')
        this.consume(tokenType.LPAREN, "Expected ( after print");
        this.parseExpression();
        this.consume(tokenType.RPAREN, "Expected ) after expression");
        this.cst.endChildren();
    }

    private parseWhileStatement() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing While Statement")
        this.cst.addNode("[WhileStatement]", "branch", line, column);
        this.consume(tokenType.KEYWORD, 'Expected [while]')
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseIfStatement() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing if Statement");
        this.cst.addNode("[IfStatement]", "branch", line, column);
        this.consume(tokenType.KEYWORD, 'Expected [if]')
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseVarDecl() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Var Decl")
        this.cst.addNode("[VarDecl]", "branch", line,column);
        this.parseType();
        this.parseId();
        this.cst.endChildren();
    }
    
    private parseType(){
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Type");
        this.cst.addNode("[type]", "branch", line, column);
        this.consume(tokenType.KEYWORD, "Expected type keyword (int, string, boolean)");
        this.cst.endChildren();
        
    }

    private parseAssignmentStatement() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Assignment Statement")
        this.cst.addNode("[AssignmentStatement]", "branch", line,column);
        this.parseId();
        this.consume(tokenType.ASSIGN, "Expected = in assignment");
        this.parseExpression();
        this.cst.endChildren();
    }

    private parseId() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Id")
        this.cst.addNode("[Id]", "branch", line,column);
        //instead of writing parseChar we will manually enter the info to the tree
        // this is because char != id as a result of lex
        this.cst.addNode("[char]", "branch");
        this.consume(tokenType.ID, `Expected variable name found ${this.peek().value}`);
        this.cst.endChildren(); //close ID node

        this.cst.endChildren(); // close char node

    }

    private parseBooleanExpr() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Bool Expr")
        this.cst.addNode("[BooleanExpression]", "branch",line,column);
        if(this.check(tokenType.BOOL)){
            this.parseBoolVal();
        }
        else{
            this.consume(tokenType.LPAREN, `Expected ( in boolean expression found ${this.peek().value}`);
            this.parseExpression();
            this.parseBoolOp();
            this.parseExpression();
            this.consume(tokenType.RPAREN, "Expected ) in boolean expression");
        }
        this.cst.endChildren();
    }

    private parseBoolVal(){
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Bool Val")
        this.cst.addNode("[BooleanValue]", "branch",line,column);
        this.consume(tokenType.BOOL, "Expected boolean value (true or false");
        this.cst.endChildren();
    }
    
    private parseBoolOp(){
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Boolean Operation")
        this.cst.addNode("[BoolOp]", "branch",line,column);
        this.consume(tokenType.EQUALITY, "Expected == or != in boolean expression");
        this.cst.endChildren();
    }

    private parseExpression() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Expr")
        this.cst.addNode("[Expression]", "branch");
        if (this.check(tokenType.NUMBER)) {
            this.parseIntExpression();
            this.cst.addNode("[IntExpression]", "leaf",line,column);
        } else if (this.check(tokenType.QUOTE)) {
            this.parseStringExpr();
        } else if (this.check(tokenType.BOOL)||this.check(tokenType.LPAREN)) {
            this.parseBooleanExpr();
        } else if (this.check(tokenType.ID)) {
            this.parseId();
        } else {
            throw new Error(`Expected expression, found [${this.peek().value}]`);
        }
        this.cst.endChildren();
    }

    private parseIntExpression() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing IntExpr")
        this.cst.addNode("[IntExpression]", "branch",line,column);
        this.parseDigit();
        if (this.peek().value == "+") {
            this.parseIntOp();
            this.parseExpression();
        }
        this.cst.endChildren();
    }

    private parseIntOp(){
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing IntOP");
        this.cst.addNode("[Intger Operation]", "branch",line,column);
        this.consume(tokenType.INTOP, "Expected Int Operation (+)");
        this.cst.endChildren();
    }

    private parseDigit() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing Digit");
        this.cst.addNode("[Digit]", "branch",line,column);
        this.consume(tokenType.NUMBER, "Expected Digit [0-9]");
        this.cst.endChildren();
    }

    private parseStringExpr() {
        const { line, column } = this.peek();
        this.logMessage("debug", "DEBUG Parser - Parsing String Expr");
        this.cst.addNode("[StringExpression]", "branch",line,column);
        this.consume(tokenType.QUOTE, "Expected opening quote");

        this.parseCharList();

        this.consume(tokenType.QUOTE, "Expected closing quote");
        this.cst.endChildren(); 
    }

    private parseCharList() {
        const { line, column } = this.peek();
        if (this.check(tokenType.QUOTE)) {
            return;
        }

        this.cst.addNode("[CharList]", "branch",line,column);

        if (this.check(tokenType.CHAR) || this.check(tokenType.SPACE)) {
            this.cst.addNode(`[${this.peek().type}]`, "branch",line,column);
            this.consume(this.peek().type, "Expected space or char in char list");
            this.cst.endChildren(); // Close CHAR node

            // Recursive call for the next CharList element
            this.parseCharList();
        }

        this.cst.endChildren(); // Close CharList node
    }

}

export function parse(tokens: Token[]): { cst: Tree, logs: string[], pass: boolean } {
    const parser = new Parser(tokens);
    return parser.parse();
}