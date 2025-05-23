
//using RegEx instead of brute force
//enum for each TYPE of token, not each token itself
export enum tokenType {
    KEYWORD = "KEYWORD",
    ID = "ID",
    NUMBER = "NUMBER",
    CHAR = "CHAR",
    WHITESPACE = "WHITESPACE", // SPACES AND NEWLINES
    ASSIGN = "ASSIGN",
    EQUALITY = "EQUALITY",
    BOOL = "BOOL",
    EOP = "EOP",
    COMMENT = "COMMENT",
    LBRACE = "LBRACE",
    RBRACE = "RBRACE",
    UNKNOWN = "UNKNOWN",
    QUOTE = "QUOTE",
    SPACE = "SPACE",
    COM_START = "COM_START",
    COM_END = "COM_END",
    LPAREN = "LPAREN",
    RPAREN = "RPAREN",
    INVALID = "INVALID",
    INTOP = "INTOP",

}

//token structure
//this is going to be called by index.ts so we need to export it
export interface Token {
    type: tokenType;
    value: string; // store every token as a string value (even if its a number)
    line: number;
    column: number;
    //inQuote: boolean;
    //inComment: boolean;
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
const tokenRegex: { type: tokenType; regex: RegExp; log: boolean; }[] = [
    { type: tokenType.KEYWORD, regex: /(int|string|boolean|print|while|if)/, log: true },
    { type: tokenType.BOOL, regex: /(true|false)/, log: true },
    { type: tokenType.ID, regex: /[a-z]/, log: true },
    { type: tokenType.NUMBER, regex: /[0-9]/, log: true },
    { type: tokenType.CHAR, regex: /[a-z]/, log: true },
    { type: tokenType.QUOTE, regex: /"/, log: true },
    { type: tokenType.LPAREN, regex: /[(]/, log: true },
    { type: tokenType.RPAREN, regex: /[)]/, log: true },
    { type: tokenType.SPACE, regex: / +/, log: true },//strings can have spaces but not new lines or tabs, I treat sequential spaces as one token for a more readable output
    { type: tokenType.WHITESPACE, regex: /\s+/, log: false },
    { type: tokenType.EQUALITY, regex: /==|!=/, log: true }, //this needs to come before the assign token
    { type: tokenType.ASSIGN, regex: /=/, log: true },
    { type: tokenType.EOP, regex: /\$/, log: true }, //$ is a special char in regex so we need the escape slash
    { type: tokenType.COM_START, regex: /\/\*/, log: false },
    { type: tokenType.COM_END, regex: /\*\//, log: false },
    { type: tokenType.LBRACE, regex: /{/, log: true },
    { type: tokenType.RBRACE, regex: /}/, log: true },
    { type: tokenType.INTOP, regex: /\+/, log: true },
]

/*
now we need to build a loop that looks through the input and:
    tracks line and column number
    identifies tokens
    in an array store the type, value, line, and column of the token
    return the array
*/

export function tokenize(input: string, line: number, column: number): { tokens: Token[], finalInComment: boolean, finalInQuote: boolean, remainingInput: string, nextLine: number, nextColumn: number } {
    const tokens: Token[] = [];
    let inQuote = false, inComment = false;

    while (input.length > 0) {
        let matchFound = false;

        for (const { type, regex, log } of tokenRegex) { //loop through regex definitions
            const match = input.match(regex);

            // Skip KEYWORD and BOOL definitions if inside a quote
            if (inQuote && (type === tokenType.KEYWORD || type === tokenType.BOOL)) {
                continue;
            }

            if (match && match.index === 0) {
                const value = match[0];


                let adjustedType = type;
                let adjustedLog = log;
                if (inQuote) {
                    if (type == tokenType.ID) {
                        adjustedType = tokenType.CHAR;
                    }
                    else if (type == tokenType.QUOTE) {
                        inQuote = false;
                    }
                    else if (type !== tokenType.SPACE) {// spaces are not chars so I didn't want to call them that in the output
                        adjustedType = tokenType.INVALID;//different from unknown for better error messages
                        adjustedLog = true;
                    }
                }
                //check if we are in quotes before comments
                //strings should take higher precedence - that way we can print /**/  if we want to, just write your comment somehwere else, like a spot that makes sense..
                //in this grammar the only things allowed within quotes are spaces and chars
                //Still I think strings take higher precedence than comments,If a developer places a comment symbol inside a string I assume they were trying to print it - even if this language doesnt allow that
                //this wayt they can get a better error message
                else if (inComment) {
                    if (type == tokenType.COM_END) {
                        inComment = false;
                    }
                    else {
                        adjustedType = tokenType.COMMENT;
                        adjustedLog = false;
                    }
                }
                else { //inQuote == false && inComment == false
                    if (type == tokenType.QUOTE) {
                        inQuote = true;
                    }
                    else if (type == tokenType.COM_START) {
                        inComment = true;
                    }
                    else if (type == tokenType.SPACE) {
                        adjustedType = tokenType.WHITESPACE; //if the quote is closed then spaces should be treated as whitespace (not displayed)
                        adjustedLog = false;
                    }
                }
                //dont put comments or whitespace into token array
                if (adjustedLog) {
                    let adjustedValue = value === "\n" ? "newline char" : value;
                    tokens.push({ type: adjustedType, value: adjustedValue, line, column });

                    // Stop tokenizing when EOP is found
                    if (adjustedType === tokenType.EOP) {
                        return {
                            tokens,
                            finalInComment: inComment,
                            finalInQuote: inQuote,
                            remainingInput: input.slice(value.length),
                            nextLine: line,
                            nextColumn: column + value.length
                        };
                    }
                }
                //update position
                const newLines = value.match(/\n/g);
                if (newLines) {
                    line += newLines.length;
                    column = value.length - value.lastIndexOf("\n");
                }
                else {
                    column += value.length;
                }

                input = input.slice(value.length);
                matchFound = true;
                break;
            }
        }
        if (!matchFound) {
            const unknownChar = input[0];
            if (inComment == false) {
                tokens.push({ type: tokenType.UNKNOWN, value: unknownChar, line, column });
            }

            if (unknownChar == "\n") {
                line++;
            }
            else {
                column++;
            }
            input = input.slice(unknownChar.length);
        }

    }
    let finalInComment = inComment;
    let finalInQuote = inQuote;
    /*
    // this logic pushes a missing EOP symbol if its missing, we can reimplement this if it is necessary for the parser
    if (tokens[tokens.length-1].type != tokenType.EOP){
        tokens.push({
            type: tokenType.EOP,
            value: "$",
            line: tokens.length > 0 ? tokens[tokens.length - 1].line : 1,
            column: tokens.length > 0 ? tokens[tokens.length - 1].column + 1 : 1
        });
    }
        */

    return { tokens, finalInComment: inComment, finalInQuote: inQuote, remainingInput: "", nextLine: line, nextColumn: column };

}