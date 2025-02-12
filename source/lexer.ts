/*
The below has been take from devNotes
lexer.ts should also do the following:

	define token structure (type, value, position (line and column?))
	distinguish between tokens with RegEx formulas
	take and input (test code) and 'tokenize' what it gets. ie use the structure and regex to assign what it reads as valid or invalid tokens
	find errors and warnings
	log the output accordingly
 */

//using RegEx instead of brute force
//enum for each TYPE of token, not each token itself
export enum tokenType {
    KEYWORD = "KEYWORD",
    ID = "ID",
    INT = "INT",
    STRING = "STRING",
    SYMBOL = "SYMBOL", // this inludes {}()
    WHITESPACE = "WHITESPACE", // SPACES AND NEWLINES
    ASSIGN = "ASSIGN",
    EQUALS = "EQUALS",
    BOOL = "BOOL",
    EOP = "EOP",
    COMMENT = "COMMENT" // SHOULD I JUST LUMP THIS INTO WHITESPACE?
}

//token structure
//this is going to be called by index.ts so we need to export it
export interface Token{
    type: tokenType;
    value: string; // store every token as a string value (even if its a number)
    line: number;
    column: number;
}

//now for regex
//first I have to learn regex...
// goal: be able to define each enum (type of token) through a regex token
// also tie each token type to it's regex definition-- for this we'll use a new ojebect which holds the tokenType and regex def

// simple defs
/*
    Keyword = int | string | boolean| print | while | if
    ID = (a-z) only one
    INT = (1-9)+(0-9)* no leading zeros
    String = anything contained in ""
    symbol = any of the following: ")}{(" (im not sure about the "")
    whitespace = space and /n newline
    assign = = (yea that looks weird)
    equals = == (..that looks weirder)
    bool = true|false
    eop = $
    comment = anything inside of slash star star slash (writing it like that to avoid breaking this comment)
    
*/


const tokenRegex: {type: tokenType; regex: RegExp}[]=[

]
