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

    let output = `INFO LEXER - Lexing program ${programCount}...\n`;

    let inComment, inQuote = false;

    for (const token of tokens) {
        const { type, value, line, column } = token;

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


        if (type === tokenType.UNKNOWN) {
            //add text color change here later
            output += `ERROR Lexer - Error on line:${line} col:${column} Unrecognized token: ${value}\n`;
            errorCount++;
        }

        else if (type !== tokenType.COM_END && type !== tokenType.COM_START) {
            output += `INFO Lexer - ${type}[ ${value} ] found at line:${line} col:${column} \n`;
        }
    }
    /*
    if(tokens[tokens.length -1].inComment == true){
        for(let i = tokens.length; i < 0;){
            if( tokens[i].inQuote == true){
                i--;
            }
            else{
                output += `WARNING UNTERMINATED COMMENT STARTING AT LINE: ${tokens[i].line} COL: ${tokens[i].column} \n`;
            }
        }
    }

    if(tokens[tokens.length -1].inQuote == true){
        output += `WARNING UNTERMINATED STRING \n`;
    }
    */

    function findLastComStartIndex(tokens: Token[]): number {
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].type === tokenType.COM_START) {
                return i; // Return index as soon as it's found
            }
        }
        return -1; // Return -1 if not found
    }
    if (inComment == true) {
        const lastComStartIndex = findLastComStartIndex(tokens);

        output += `WARNING UNTERMINATED COMMENT BEGINNING AT LINE: ${tokens[lastComStartIndex].line} COL: ${tokens[lastComStartIndex].column} \n`;
    }
    if (inQuote == true) {
        output += `WARNING UNTERMINATED QUOTE \n`
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