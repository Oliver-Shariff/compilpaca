import { tokenize, Token, tokenType } from './lexer.js';
/*
This file should delliver JS to index.html
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
    const { tokens, finalInComment, finalInQuote, } = tokenize(inputCode);

    const outputLog = formatTokens(tokens, finalInComment, finalInQuote);
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
function formatTokens(tokens: Token[], finalInComment: boolean, finalInQuote: boolean): string {
    let errorCount = 0, warnCount = 0, programCount = 0;
    let output = "";
    let programTokens: Token[] = []; // Store tokens of the current program

    for (const token of tokens) {
        const { type, value, line, column } = token;

        if (type === tokenType.EOP) {
            programTokens.push(token);
            // End of a program
            programCount++;
            output += `INFO Lexer - Lexing program ${programCount}...\n`;

            // Process the current program
            output += processProgram(programTokens, errorCount, warnCount, finalInComment, finalInQuote, true);//set this to true since we found EOP

            // Reset counters for the next program
            errorCount = 0;
            warnCount = 0;
            programTokens = []; // Start collecting for the next program
        } else {
            // Collect tokens for the current program
            programTokens.push(token);
        }
    }

    // Handle the last program if no explicit EOP is found
    if (programTokens.length > 0) {
        programCount++;
        output += `\nINFO Lexer - Lexing program ${programCount}...\n`;
        output += processProgram(programTokens, errorCount, warnCount, finalInComment, finalInQuote, false);//false since tokens are left over with no explicit EOP
    }
    return output;
}
function processProgram(programTokens: Token[], errorCount: number, warnCount: number, finalInComment: boolean, finalInQuote: boolean, EOPfound: boolean): string {
    let output = "";

    for (const token of programTokens) {
        const { type, value, line, column } = token;

        if (type === tokenType.UNKNOWN) {
            output += `ERROR Lexer - Error on line:${line} col:${column} Unrecognized token: ${value}\n`;
            errorCount++;
        } else if (type !== tokenType.COM_END && type !== tokenType.COM_START) {
            output += `INFO Lexer - ${type}[ ${value} ] found at line:${line} col:${column} \n`;
        }
    }

    if (finalInComment) {
        const lastIndex = findLastIndex(programTokens, tokenType.COM_START);
        warnCount++;
        output += `WARNING Lexer - Unterminated Comment starts at: ${programTokens[lastIndex].line} COL: ${programTokens[lastIndex].column} \n`;
    }
    if (finalInQuote) {
        const lastIndex = findLastIndex(programTokens, tokenType.QUOTE);
        warnCount++;
        output += `WARNING Lexer - Unterminated Quote starts at: ${programTokens[lastIndex].line} COL: ${programTokens[lastIndex].column} \n`;
    }
    if (EOPfound ===  false) {
        warnCount++;
        output += `WARNING Lexer - Missing EOP at end of file! \n`;
    }

    if (errorCount === 0) {
        output += `INFO Lexer - Lex completed with 0 errors and ${warnCount} warnings \n`;
        output += `\n`;
    } else {
        output += `ERROR Lexer - Lex failed with ${errorCount} errors and ${warnCount} warnings \n`;
        output += `\n`;
    }

    return output;
}


function findLastIndex(tokens: Token[], targetType: tokenType): number {
    for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i].type === targetType) {
            return i;
        }
    }
    return -1;
}

document.addEventListener("DOMContentLoaded", () => {
    const lexButton = document.getElementById("lexButton");
    lexButton.addEventListener("click", handleLexing);
});