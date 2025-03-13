import { tokenize, Token, tokenType } from './lexer.js';

class Parser{
    private tokens: Token[];
    private current: number = 0;


    /*Helper methods */

    //look at current token
    private peek(): Token{
        return this.tokens[this.current];
    }

    //check for end of program with EOP
    private isAtEnd(): boolean{
        return this.peek().type === tokenType.EOP;
    }

    // get previous token
    private previous(): Token{
        return this.tokens[this.current -1];
    }

    //check token type without consuming it
    private check(type: tokenType): boolean{
        if (this.isAtEnd()) return false; // this should prevent me from checking the next program by accident
        return this.peek().type === type;
    }

    //move to next token and return previous one
    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    //check current token and advance if type matches - return boolean
    private match(type: tokenType): boolean{
        if (this.check(type)){
            this.advance();
            return true;
        }
        return false;
    }

    //check current token and advance if type matches - return next token
    private consume(type: tokenType, message: string): Token {
        if(this.check(type)) return this.advance();
        throw new Error(message);
    }
    


    /*Parsing methods */


}
