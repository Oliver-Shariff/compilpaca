import { tokenize, Token, tokenType } from './lexer.js';
import { Tree } from './tree.js';

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

    private logMessage(type: string, message: string) { //type here is css class for formatting
        this.log.push(`<span class="${type}">${message}</span>`);
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
            console.log("Consumed: " + token.value)
            this.cst.addNode(token.value, "leaf");
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
        this.logMessage("debug", "DEBUG Parser - Parsing Program");
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
        this.logMessage("debug", "DEBUG Parser - Parsing Print Statement")
        this.cst.addNode("[PrintStatement]", "branch");
        this.consume(tokenType.KEYWORD, 'Expected [print]')
        this.consume(tokenType.LPAREN, "Expected ( after print");
        this.parseExpression();
        this.consume(tokenType.RPAREN, "Expected ) after expression");
        this.cst.endChildren();
    }

    private parseWhileStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing While Statement")
        this.cst.addNode("[WhileStatement]", "branch");
        this.consume(tokenType.KEYWORD, 'Expected [while]')
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseIfStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing if Statement");
        this.cst.addNode("[IfStatement]", "branch");
        this.consume(tokenType.KEYWORD, 'Expected [if]')
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseVarDecl() {
        this.logMessage("debug", "DEBUG Parser - Parsing Var Decl")
        this.cst.addNode("[VarDecl]", "branch");
        this.parseType();
        this.parseId();
        this.cst.endChildren();
    }
    
    private parseType(){
        this.logMessage("debug", "DEBUG Parser - Parsing Type");
        this.cst.addNode("[type]", "branch");
        this.consume(tokenType.KEYWORD, "Expected type keyword (int, string, boolean)");
        this.cst.endChildren();
        
    }

    private parseAssignmentStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing Assignment Statement")
        this.cst.addNode("[AssignmentStatement]", "branch");
        this.parseId();
        this.consume(tokenType.ASSIGN, "Expected = in assignment");
        this.parseExpression();
        this.cst.endChildren();
    }

    private parseId() {
        this.logMessage("debug", "DEBUG Parser - Parsing Id")
        this.cst.addNode("[Id]", "branch");
        //instead of writing parseChar we will manually enter the info to the tree
        // this is because char != id as a result of lex
        this.cst.addNode("[char]", "branch");
        this.consume(tokenType.ID, `Expected variable name found ${this.peek().value}`);
        this.cst.endChildren();

        this.cst.endChildren();

    }

    private parseBooleanExpr() {
        this.logMessage("debug", "DEBUG Parser - Parsing Bool Expr")
        this.cst.addNode("[BooleanExpression]", "branch");
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
        this.logMessage("debug", "DEBUG Parser - Parsing Bool Val")
        this.cst.addNode("[BooleanValue]", "branch");
        this.consume(tokenType.BOOL, "Expected boolean value (true or false");
        this.cst.endChildren();
    }
    
    private parseBoolOp(){
        this.logMessage("debug", "DEBUG Parser - Parsing Boolean Operation")
        this.cst.addNode("[BoolOp]", "branch");
        this.consume(tokenType.EQUALITY, "Expected == or != in boolean expression");
        this.cst.endChildren();
    }

    private parseExpression() {
        this.logMessage("debug", "DEBUG Parser - Parsing Expr")
        this.cst.addNode("[Expression]", "branch");
        if (this.check(tokenType.NUMBER)) {
            this.parseIntExpression();
            this.cst.addNode("[IntExpression]", "leaf");
        } else if (this.check(tokenType.QUOTE)) {
            this.parseStringExpr();
        } else if (this.check(tokenType.BOOL)||this.check(tokenType.LPAREN)) {
            this.parseBooleanExpr();
        } else if (this.check(tokenType.ID)) {
            this.parseId();
        } else {
            throw new Error(`Expected statement, found [${this.peek().value}]`);
        }
        this.cst.endChildren();
    }

    private parseIntExpression() {
        this.logMessage("debug", "DEBUG Parser - Parsing IntExpr")
        this.cst.addNode("[IntExpression]", "branch");
        this.parseDigit();
        if (this.peek().value == "+") {
            this.parseIntOp();
            this.parseExpression();
        }
        this.cst.endChildren();
    }

    private parseIntOp(){
        this.logMessage("debug", "DEBUG Parser - Parsing IntOP");
        this.cst.addNode("[Intger Operation]", "branch");
        this.consume(tokenType.INTOP, "Expected Int Operation (+)");
        this.cst.endChildren();
    }

    private parseDigit() {
        this.logMessage("debug", "DEBUG Parser - Parsing Digit");
        this.cst.addNode("[Digit]", "branch");
        this.consume(tokenType.NUMBER, "Expected Digit [0-9]");
        this.cst.endChildren();
    }

    private parseStringExpr() {
        this.logMessage("debug", "DEBUG Parser - Parsing String Expr");
        this.cst.addNode("[StringExpression]", "branch");
        this.consume(tokenType.QUOTE, "Expected opening quote");

        this.parseCharList();

        this.consume(tokenType.QUOTE, "Expected closing quote");
        this.cst.endChildren(); // Close StringExpression node
    }

    private parseCharList() {
        if (this.check(tokenType.QUOTE)) {
            return;
        }

        this.cst.addNode("[CharList]", "branch");

        if (this.check(tokenType.CHAR) || this.check(tokenType.SPACE)) {
            this.cst.addNode(`[${this.peek().type}]`, "branch");
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