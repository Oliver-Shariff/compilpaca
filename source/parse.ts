import { tokenize, Token, tokenType } from './lexer.js';

class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]){
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

    private parseBlock(): any{
        this.consume(tokenType.LBRACE, 'Expected { at start of block');
        //const statements = this.parseStatementList();
        this.consume(tokenType.RBRACE, 'Expected } at end of block');
        return {type: 'Block', /*body: statements*/};
        //^ lets comment that out so we can test it
    }

}
export function parse(tokens: Token[]): any {
    const parser = new Parser(tokens);
    return parser.parseProgram();
}