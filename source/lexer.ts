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
    NUMBER = "NUMBER",
    STRING = "STRING",
    SYMBOL = "SYMBOL", // this inludes {}()
    WHITESPACE = "WHITESPACE", // SPACES AND NEWLINES
    ASSIGN = "ASSIGN",
    EQUALITY = "EQUALITY",
    BOOL = "BOOL",
    EOP = "EOP",
    COMMENT = "COMMENT", // SHOULD I JUST LUMP THIS INTO WHITESPACE?
    OPEN = "OPEN", // {} for open and closing will need to be recognized seperate from just symbol when they encapsulate the whole program and not just a statement list 
    CLOSE = "CLOSE"
}

//token structure
//this is going to be called by index.ts so we need to export it
export interface Token{
    type: tokenType;
    value: string; // store every token as a string value (even if its a number)
    line: number;
    column: number;
}

/*
//now for regex
//first I have to learn regex...
// goal: be able to define each enum (type of token) through a regex token

// simple defs
Keyword = int | string | boolean| print | while | if
ID = (a-z) only one
INT = (1-9)+(0-9)* no leading zeros
        actually nothing in the grammar restricts leading zeros
        also change int to number since int is already a keywordNumber
NUMBER = (0-9)+
String = anything contained in "" EXCEPT FOR "|"
symbol = any of the following: ")}{(" (im not sure about the "")
whitespace = space and /n newline
assign = = (yea that looks weird)
equals = == (..that looks weirder)
        dont forget != too, lets change this to equality
bool = true|false
eop = $
comment = anything inside of slash star star slash (writing it like that to avoid breaking this comment)


*/


//tie each token type to it's regex definition-- for this we'll use a new ojebect which holds the tokenType and regex def
const tokenRegex: {type: tokenType; regex: RegExp}[]=[
    {type: tokenType.KEYWORD, regex: /\b(int|string|boolean|print|while|if)\b/},
    {type: tokenType.ID, regex: /\b[a-z]\b/ },
    {type: tokenType.NUMBER, regex: /\b[0-9]+\b/}, //the grammar may not allow for a multi digit number
    {type: tokenType.STRING, regex: /"([^"]*)"/},
    {type: tokenType.SYMBOL, regex: /[{}()$]/},
    {type: tokenType.WHITESPACE, regex: /\s+/},
    {type: tokenType.EQUALITY, regex: /==|!=/ }, //this needs to come before the assign token
    {type: tokenType.ASSIGN, regex: /=/ },
    {type: tokenType.BOOL, regex:/\b(true|false)\b/ },
    {type: tokenType.EOP, regex:/\$/ }, //$ is a special char in regex so we need the escape slash
    {type: tokenType.COMMENT, regex: /\/\*[\s\S]*?\*\//}, //  * and / are special char in regex so they both need to be escaped
    {type: tokenType.OPEN, regex: /{/},
    {type: tokenType.CLOSE, regex: /}/},
]
/*
now we need to build a loop that looks through the input and:
    tracks line and column number
    identifies tokens
    in an array store the type, value, line, and column of the token
    return the array
*/

