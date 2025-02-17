import { tokenize, Token, tokenType } from './lexer.js';
/*
This fie should delliver JS to index.html
tasks:
    take input code
    call tokenize function from lexer.ts
    format resulting tokens[] into debug log
    display debug log on index.html

    also support button clicks and later further page styling
*/
function handleLexing() {
    const inputElement = document.getElementById("codeInput") as HTMLTextAreaElement;
    const outputElement = document.getElementById("tokenOutput") as HTMLPreElement;

    const inputCode = inputElement.value;
    const tokens: Token[] = tokenize(inputCode);

    const outputLog = formatTokens(tokens);
    outputElement.textContent = outputLog;
}
/*
formatTokens() goal
    take in tokens[] from tokenize function
    return info in text
    identify and count errors
    identify and count warnings
    count programs
*/
function formatTokens(tokens: Token[]): string {
    let errorCount = 0, programCount = 1, warnCount = 0;

    let output = `INFO Lexer - Lexing program ${programCount}...\n`;

    let inComment, inQuote = false;

    for (const token of tokens) {
        const { type, value, line, column } = token;

        if (type === tokenType.UNKNOWN) {
            //add text color change here later
            output += `ERROR Lexer - Error on line:${line} col:${column} Unrecognized token: ${value}\n`;
            errorCount++;
        }

        else if (type !== tokenType.COM_END && type !== tokenType.COM_START) {
            output += `INFO Lexer - ${type}[ ${value} ] found at line:${line} col:${column} \n`;
        }
        //this block lets me determine if we end the prgram while in a comment or string
        //we could just use the interface to pass this info here but we don't want to store comments in the token stream
        //we do still have to store the comment's start and end symbols or there is no way to tell that we are still in a comment
        if (type === tokenType.COM_START) {
            inComment = true;
        }
        else if (type === tokenType.COM_END) {
            inComment = false;
        }
        else if (type === tokenType.QUOTE) {
            if (inQuote == false) {
                inQuote = true;
            }
            else {
                inQuote = false;
            }
        }
    }

    function findLastIndex(tokens: Token[], targetType: tokenType): number {
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].type === targetType) {
                return i;
            }
        }
        return -1;
    }

    if (inComment == true) {
        const lastIndex = findLastIndex(tokens, tokenType.COM_START);
        warnCount++;
        output += `WARNING UNTERMINATED COMMENT BEGINNING AT LINE: ${tokens[lastIndex].line} COL: ${tokens[lastIndex].column} \n`;
    }
    if (inQuote == true) {
        const lastIndex = findLastIndex(tokens, tokenType.QUOTE);
        warnCount++;
        output += `WARNING UNTERMINATED QUOTE BEGINNING AT LINE: ${tokens[lastIndex].line} COL: ${tokens[lastIndex].column} \n`
    }
    if (tokens[tokens.length-1].type != tokenType.EOP){
        warnCount++;
        output += `Warning: Missing EOP at end of file! \n`;
        //do I need to actually add this token to the array? that depends on how I implement parse and where parse.ts will retrieve the tokens from.
        //let's implement this push on the safe side and reevalate later, it makes more sense to add it to lexer.ts but then we can;t give an error message to the user
        tokens.push({
            type: tokenType.EOP,
            value: "$",
            line: tokens.length > 0 ? tokens[tokens.length - 1].line : 1,
            column: tokens.length > 0 ? tokens[tokens.length - 1].column + 1 : 1
        });
    }

    if (errorCount === 0) {
        output += `INFO Lexer - Lex completed with 0 errors and ${warnCount} warnings`;
    }
    else {
        output += `ERROR Lexer - Lex failed with ${errorCount} errors and ${warnCount} warnings`;
    }


    return output;
}

document.addEventListener("DOMContentLoaded", () => {
    const lexButton = document.getElementById("lexButton");
    lexButton.addEventListener("click", handleLexing);
});