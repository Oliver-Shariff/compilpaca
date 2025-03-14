import { tokenize, Token, tokenType } from './lexer.js';
import { Tree } from './treeDemo.js'; // Import the Tree class

class Parser {
    private tokens: Token[];
    private current: number = 0;
    private log: string[] = []; // Store logs here

    constructor(tokens: Token[]) {
        this.tokens = tokens;
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
            //this.logMessage("info", `INFO Parser - Consumed token: ${token.type}, value: "${token.value}"`);
            return token;
        }
        throw new Error(message);
    }



    /*Parsing methods */
    public parse(): { cst: any, logs: string[], pass: boolean } {
        try {
            this.logMessage("info", "INFO Parser - Starting parsing...");
            const cst = this.parseProgram();
            this.logMessage("success", "INFO Parser - Successfully parsed program!\n");
            this.logMessage('info', '\n');
            return { cst, logs: this.log, pass: true };
        } catch (error) {
            this.logMessage("error", `ERROR Parser - ${error.message}`);
            this.logMessage('fail', 'FAIL Parser - failed with 1 error');
            return { cst: null, logs: this.log, pass: false };
        }
    }

    private parseProgram(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing Program")
        const body = this.parseBlock();
        this.consume(tokenType.EOP, 'Expected end of program ($)');
        return { type: 'Program', body };
    }

    private parseBlock(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing block")
        this.consume(tokenType.LBRACE, 'Expected { at start of block');
        const statements = this.parseStatementList();
        this.consume(tokenType.RBRACE, 'Expected } at end of block');
        return { type: 'Block', body: statements };

    }

    private parseStatementList(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing statement list")
        const statements = [];
        while (!this.check(tokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        //parse statements and push into array
        return statements;
    }
    private parseStatement(): any {
        //we can see what type of statement we have based on the first token
        this.logMessage("debug", "DEBUG Parser - Parsing statement")
        if (this.peek().type === tokenType.KEYWORD) {
            this.consume(tokenType.KEYWORD, 'Expected keyword')

            switch (this.previous().value) {
                case 'print':
                    return this.parsePrintStatement();
                case 'while':
                    return this.parseWhileStatement();
                case 'if':
                    return this.parseIfStatement();
                case 'int':
                case 'string':
                case 'boolean':
                    return this.parseVarDecl();
            }
        }
        if (this.match(tokenType.ID)) {
            return this.parseAssignmentStatement();
        }
        if (this.check(tokenType.LBRACE)) {
            return this.parseBlock();
        }
        this.logMessage('error', `Unexpected token: ${this.peek().value}`);
        return null;
    }

    private parsePrintStatement(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing print statement")
        this.consume(tokenType.LPAREN, 'Expected ( after print');
        const expr = this.parseExpression();
        this.consume(tokenType.RPAREN, 'Expected ) after expression');
        return { type: 'PrintStatement', expression: expr };
    }

    private parseAssignmentStatement(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing assignment statement")
        const id = this.previous();
        this.consume(tokenType.ASSIGN, 'Expected = in assignment');
        const expr = this.parseExpression();
        return { type: 'AssignmentStatement', id, expression: expr };
    }

    private parseVarDecl(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing var decl")
        const type = this.previous();
        const id = this.consume(tokenType.ID, 'Expected variable name');
        return { type: 'VarDecl', varType: type, id };
    }

    private parseWhileStatement(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing while statement")
        const condition = this.parseBooleanExpr();
        const body = this.parseBlock();
        return { type: 'WhileStatement', condition, body };
    }

    private parseIfStatement(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing if statement")
        const condition = this.parseBooleanExpr();
        const body = this.parseBlock();
        return { type: 'IfStatement', condition, body };
    }

    private parseExpression(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing expression")
        if (this.match(tokenType.NUMBER)) {
            return this.parseIntExpr();
        }
        if (this.match(tokenType.QUOTE)) {
            return this.parseStringExpr();
        }
        if (this.match(tokenType.BOOL)) {
            return { type: 'BooleanLiteral', value: this.previous().value };
        }
        if (this.match(tokenType.LPAREN)) {
            return this.parseBooleanExpr();
        }
        if (this.match(tokenType.ID)) {
            return { type: 'Identifier', name: this.previous().value };
        }
        this.logMessage('error', `Unexpected token: ${this.peek().value}`);
        return null;
    }

    private parseIntExpr(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing int expression")
        let left = { type: 'Literal', value: this.previous().value };
        if (this.match(tokenType.INTOP)) {
            const operator = this.previous();
            const right = this.parseExpression();
            return { type: 'BinaryExpression', left, operator, right };
        }
        return left;
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

    private parseBooleanExpr(): any {
        this.logMessage("debug", "DEBUG Parser - Parsing bool expression")
        if (this.match(tokenType.BOOL)) {
            return { type: 'BooleanLiteral', value: this.previous().value };
        }
        this.consume(tokenType.LPAREN, 'Expected ( in boolean expression');
        const left = this.parseExpression();
        const operator = this.consume(tokenType.EQUALITY, 'Expected == or != in boolean expression');
        const right = this.parseExpression();
        this.consume(tokenType.RPAREN, 'Expected ) in boolean expression');
        return { type: 'BooleanExpression', left, operator, right };
    }

}//class boundary

export function parse(tokens: Token[]): { cst: any, logs: string[] } {
    const parser = new Parser(tokens);
    return parser.parse();
}