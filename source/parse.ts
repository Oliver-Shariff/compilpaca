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
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    //check current token, advance and return boolean
    //I need to be careful that these tokens still get added to cst
    private match(type: tokenType): boolean {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    //check current token, advance and return next token
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
            this.logMessage("info", "INFO Parser - Starting parsing...");// may remove this and add in index to inlcude program count
            this.cst.addNode("[Program]", "branch");
            this.parseProgram();
            this.logMessage("success", "INFO Parser - Successfully parsed program! \n");
            this.cst.endChildren();
            return { cst: this.cst, logs: this.log, pass: true };
        } catch (error) {
            this.logMessage("error", `ERROR Parser - ${error.message}`);
            this.logMessage('fail', 'FAIL Parser - failed with 1 error \n');
            return { cst: null, logs: this.log, pass: false };
        }
    }

    private parseProgram() {
        this.logMessage("debug", "DEBUG Parser - Parsing Program")
        this.cst.addNode("[Block]", "branch");
        this.parseBlock();
        this.cst.endChildren();
        this.consume(tokenType.EOP, 'Expected end of program ($)');
    }

    private parseBlock() {
        this.logMessage("debug", "DEBUG Parser - Parsing Block")
        this.consume(tokenType.LBRACE, 'Expected { at start of block');
        this.cst.addNode("[StatementList]", "branch");
        this.parseStatementList();
        this.cst.endChildren();
        this.consume(tokenType.RBRACE, 'Expected } at end of block');
    }

    private parseStatementList() {
        this.logMessage("debug", "DEBUG Parser - Parsing Statement List")
        while (!this.check(tokenType.RBRACE) && !this.isAtEnd()) {
            this.parseStatement();
        }
    }

    private parseStatement() {
        //we can see what type of statement we have based on the first token
        this.logMessage("debug", "DEBUG Parser - Parsing Statement")
        if (this.check(tokenType.KEYWORD)) {
            let keyword = this.peek().value;
            this.cst.addNode("[Statement]", "branch");
            switch (keyword) {//this could be cleaner with multiple if statements but this is readable
                case "print":
                    this.cst.addNode("[PrintStatement]", "branch");
                    this.consume(tokenType.KEYWORD, 'Expected [print]')
                    this.parsePrintStatement();
                    this.cst.endChildren();
                    break;
                case "while":
                    this.cst.addNode("[WhileStatement]", "branch");
                    this.consume(tokenType.KEYWORD, 'Expected [while]')
                    this.parseWhileStatement();
                    this.cst.endChildren();
                    break;
                case "if":
                    this.cst.addNode("[IfStatement]", "branch");
                    this.consume(tokenType.KEYWORD, 'Expected [if]')
                    this.parseIfStatement();
                    this.cst.endChildren();
                    break;
                case "int":
                case "string":
                case "boolean":
                    this.parseVarDecl();
                    break;
            }
            this.cst.endChildren();
            this.cst.endChildren();
        } else if (this.peek().type === tokenType.ID) {
            this.cst.addNode("[AssignmentStatement]", "branch");
            this.consume(tokenType.ID, 'Expected [id]');
            this.parseAssignmentStatement();
            this.cst.endChildren();
        } else if (this.check(tokenType.LBRACE)) {
            this.parseBlock();
        } else {
            this.logMessage("error", `Unexpected token: ${this.peek().value}`);
        }
    }

    private parsePrintStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing Print Statement")
        this.consume(tokenType.LPAREN, "Expected ( after print");
        this.cst.addNode("[Expression]", "branch");
        this.parseExpression();
        this.cst.endChildren();
        this.consume(tokenType.RPAREN, "Expected ) after expression");
    }

    private parseWhileStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing While Statement")
        this.cst.addNode("[WhileStatement]", "branch");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseIfStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing if Statement")
        this.cst.addNode("[IfStatement]", "branch");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.endChildren();
    }

    private parseVarDecl() {
        this.logMessage("debug", "DEBUG Parser - Parsing Var Decl")
        this.cst.addNode("[VarDecl]", "branch");
        this.consume(tokenType.KEYWORD, "Expected type keyword (int, string, boolean)");
        this.consume(tokenType.ID, "Expected variable name");
        this.cst.endChildren();
    }

    private parseAssignmentStatement() {
        this.logMessage("debug", "DEBUG Parser - Parsing Assignment Statement")
        this.consume(tokenType.ID, `Expected variable name found ${this.peek().value}`);
        this.consume(tokenType.ASSIGN, "Expected = in assignment");
        this.cst.addNode("[Expression]", "branch");
        this.parseExpression();
        this.cst.endChildren();
    }

    private parseBooleanExpr() {
        this.logMessage("debug", "DEBUG Parser - Parsing Bool Expr")
        this.consume(tokenType.LPAREN, "Expected ( in boolean expression");
        this.cst.addNode("[BooleanExpression]", "branch");
        this.parseExpression();
        this.consume(tokenType.EQUALITY, "Expected == or != in boolean expression");
        this.parseExpression();
        this.consume(tokenType.RPAREN, "Expected ) in boolean expression");
        this.cst.endChildren();
    }

    private parseExpression() {
        this.logMessage("debug", "DEBUG Parser - Parsing Expr")
        if (this.match(tokenType.NUMBER)) {
            this.cst.addNode("[IntExpression]", "leaf");
        } else if (this.peek().type === tokenType.QUOTE) {
            this.parseStringExpr();
        } else if (this.match(tokenType.BOOL)) {
            this.cst.addNode("[BooleanLiteral]", "leaf");
        } else if (this.match(tokenType.LPAREN)) {
            this.parseBooleanExpr();
        } else if (this.match(tokenType.ID)) {
            this.cst.addNode("[Identifier]", "leaf");
        } else {
            this.logMessage("error", `Unexpected token: ${this.peek().value}`);
        }
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
    
        if (this.match(tokenType.CHAR) || this.match(tokenType.SPACE)) {
            this.cst.addNode("[CHAR]", "branch");
            this.cst.addNode(`[${this.previous().value}]`, "leaf");
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