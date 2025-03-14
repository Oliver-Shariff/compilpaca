import { tokenize, Token, tokenType } from './lexer.js';
import { parse } from './parse.js'
import { Tree } from './tree.js'; // Import the Tree class
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

    let inputCode = inputElement.value.trim();
    let line = 1, column = 0;
    let outputLog = "";
    let programCount = 0;

    while (inputCode.length > 0) {
        const { tokens, finalInComment, finalInQuote, remainingInput, nextLine, nextColumn } = tokenize(inputCode, line, column);

        if (tokens.length > 0) {
            programCount++;
            outputLog += `\n<span class="info">INFO Lexer - Lexing program ${programCount}...</span>\n`;
            const lexOutput = formatTokens(tokens, finalInComment, finalInQuote);
            outputLog += lexOutput;
            // Call the parser here after lexing
            if (lexOutput.includes("ERROR Lexer")) {
                outputLog += `<span class="fail">Parser - Skipping Parse due to lexing errors.</span>\n`;
            }
            else {
                const { cst, logs, pass } = parse(tokens);
                console.log(`program : ${programCount} pass state is ${pass}`)
                // Append parser logs to output
                outputLog += logs.join("\n");

                if (pass && cst) {
                    outputLog += `\n<span class="info">INFO Parser - Concrete Syntax Tree:</span>\n`;
                    outputLog += cst.toString()+ "\n" ;
                    console.log(cst);
                } else {
                    outputLog += `<span class="error">ERROR Parser - Parsing failed. No CST generated.</span>\n`;

                }

            }

        }

        inputCode = remainingInput;
        line = nextLine;
        column = nextColumn;
        console.log(tokens) // I can call the parse tokens function here
    }


    outputElement.innerHTML = outputLog;
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
        output += `\n<span class="info">INFO Lexer - Lexing program ${programCount}...</span>\n`;
        output += processProgram(programTokens, errorCount, warnCount, finalInComment, finalInQuote, false);//false since tokens are left over with no explicit EOP
    }
    return output;
}
function processProgram(programTokens: Token[], errorCount: number, warnCount: number, finalInComment: boolean, finalInQuote: boolean, EOPfound: boolean): string {
    let output = "";

    for (const token of programTokens) {
        const { type, value, line, column } = token;

        if (type === tokenType.UNKNOWN) {
            output += `<span class="error">ERROR Lexer - Error on line:${line} col:${column} Unrecognized token: [ ${value} ]\n</span>`;
            errorCount++;
        }
        else if (type === tokenType.INVALID) {
            output += `<span class="error">ERROR Lexer - Error on line:${line} col:${column} Invalid token inside string:[ ${value} ]only lowercase a-z allowed\n</span>`;
            errorCount++;
        }
        else if (type !== tokenType.COM_END && type !== tokenType.COM_START) {
            output += `<span class="info">INFO Lexer - ${type}[ ${value} ] found at line:${line} col:${column} </span>\n`;
        }
    }

    if (finalInComment) {
        const lastIndex = programTokens.length - 1;
        warnCount++;
        output += `<span class="warning">WARNING Lexer - Unterminated Comment starts at: ${programTokens[lastIndex].line} COL: ${programTokens[lastIndex].column} </span>\n`;
    }
    if (finalInQuote) {
        const lastIndex = findLastIndex(programTokens, tokenType.QUOTE);
        warnCount++;
        output += `<span class="warning">WARNING Lexer - Unterminated Quote starts at: ${programTokens[lastIndex].line} COL: ${programTokens[lastIndex].column} </span>\n`;
    }
    if (EOPfound === false) {
        warnCount++;
        output += `<span class="warning">WARNING Lexer - Missing EOP at end of file! <span>\n`;
    }

    if (errorCount === 0) {
        output += `<span class="success">INFO Lexer - SUCCESS Lex completed with 0 errors and ${warnCount} warning(s) </span>\n`;
        output += `\n`;
    } else {
        output += `<span class="fail">ERROR Lexer - FAIL Lex failed with ${errorCount} error(s) and ${warnCount} warning(s) </span>\n`;
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