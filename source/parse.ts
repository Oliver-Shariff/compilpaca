import { tokenize, Token, tokenType } from './lexer.js';

class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }


    /*Helper methods */

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
        if (this.check(type)) return this.advance();
        throw new Error(message);
    }



    /*Parsing methods */

    /*
    These will be nested in each other like so

    parseProgram(){
        parseBlock();
    }
    parseBlock(){
        match(L_Brace)
        parseStatementList() // here I need to find a way to keep calling this while what is inside is a statement
        
        match(R_Brace)
    }

    */
    public parseProgram(): any {
        const body = this.parseBlock(); //assign this to body so we can use it for CST later
        this.consume(tokenType.EOP, 'Expected end of program($)');
        return { type: 'Program', body }
    }

    private parseBlock(): any {
        this.consume(tokenType.LBRACE, 'Expected { at start of block');
        const statements = this.parseStatementList();
        this.consume(tokenType.RBRACE, 'Expected } at end of block');
        return { type: 'Block', body: statements };

    }

    private parseStatementList(): any {
        const statements = [];
        while (!this.check(tokenType.RBRACE) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        //parse statements and push into array
        return statements;
    }
    private parseStatement(): any {
        //we can see what type of statement we have based on the first token
        if (this.match(tokenType.KEYWORD)) {
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
    if (this.match(tokenType.ID)){
        return this.parseAssignmentStatement();
    }
    if (this.check(tokenType.LBRACE)){
        return this.parseBlock();
    }
    throw new Error ('Unexpected token: ' + this.peek().value);
    }

    private parsePrintStatement(): any{
        this.consume(tokenType.LPAREN, 'Expected ( after print');
        const expr = this.parseExpression();
        this.consume(tokenType.RPAREN, 'Expected ) after expression');
        return {type: 'PrintStatement', expression: expr};
    }

    private parseAssignmentStatement(): any {
        const id = this.previous();
        this.consume(tokenType.ASSIGN, 'Expected = in assignment');
        const expr = this.parseExpression();
        return { type: 'AssignmentStatement', id, expression: expr };
    }

    private parseVarDecl(): any {
        const type = this.previous();
        const id = this.consume(tokenType.ID, 'Expected variable name');
        return { type: 'VarDecl', varType: type, id };
    }

    private parseWhileStatement(): any {
        const condition = this.parseBooleanExpr();
        const body = this.parseBlock();
        return { type: 'WhileStatement', condition, body };
    }

    private parseIfStatement(): any {
        const condition = this.parseBooleanExpr();
        const body = this.parseBlock();
        return { type: 'IfStatement', condition, body };
    }

    private parseExpression(): any {
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
        throw new Error('Unexpected expression token: ' + this.peek().value);
    }

    private parseIntExpr(): any {
        let left = { type: 'Literal', value: this.previous().value };
        if (this.match(tokenType.INTOP)) {
            const operator = this.previous();
            const right = this.parseExpression();
            return { type: 'BinaryExpression', left, operator, right };
        }
        return left;
    }

    private parseStringExpr(): any {
        const chars = [];
        while (!this.match(tokenType.QUOTE)) {
            if (this.match(tokenType.CHAR) || this.match(tokenType.SPACE)) {
                chars.push(this.previous().value);
            } else {
                throw new Error('Unexpected token in string: ' + this.peek().value);
            }
        }
        return { type: 'StringLiteral', value: chars.join('') };
    }

    private parseBooleanExpr(): any {
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

export function parse(tokens: Token[]): any {
    const parser = new Parser(tokens);
    return parser.parseProgram();
}