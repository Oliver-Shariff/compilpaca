import { tokenize, Token, tokenType } from './lexer.js';
import { parse } from './parse.js'
import { buildAST } from './ast.js';
import { analyzeScope } from './scopeAnalyzer.js';
import { generateCode } from './codeGen.js';

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

    outputElement.innerHTML = "";  // Clear previous output

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
            outputLog += lexOutput;  //UNCOMMENT THIS!
            console.log(tokens);
            // Call the parser here after lexing
            if (lexOutput.includes("ERROR Lexer")) {
                outputLog += `<span class="fail">Parser - Skipping Parse due to lexing errors.</span>\n`;
            }
            else {
                const { cst, logs, pass } = parse(tokens);
                outputLog += `\n<span class="info">INFO Parser - Parsing program ${programCount}...</span>\n`;
                // Append parser logs to output
                outputLog += logs.join("\n"); // UNCOMMENT THIS!

                if (pass && cst) {
                    outputLog += `\n<span class="info">INFO Parser - Concrete Syntax Tree Program ${programCount}:</span>\n`;
                    outputLog += cst.toString() + "\n"; //UNCOMMENT THIS!
                    outputLog += `<span class="success">INFO Parse - Concrete Syntax Tree for Program ${programCount} generated! </span>\n`;


                    const ast = buildAST(cst);
                    if (ast) {
                        outputLog += `\n<span class="info">INFO Semantic Analyzer - Abstract Syntax Tree Program ${programCount}:</span>\n`;
                        outputLog += ast.toString() + "\n";
                        outputLog += `<span class="success">INFO Semantic Analyzer - Abstract Syntax Tree for Program ${programCount} generated! </span>\n`;
                        outputLog += `\n`

                        const { log: scopeLog, rootScope } = analyzeScope(ast);

                        outputLog += scopeLog.map(line => `<span class="info">${line}</span>\n`).join("");

                        const scopeError = scopeLog.some(line => line.includes("FAIL"));

                        if (scopeError) {
                            outputLog += `<span class ="error">ERROR Code Gen - Code Gen Skipped due to scope errors`
                        }

                        else {
                            outputLog += `<span class="success">INFO Semantic Analyzer - Decorated AST for Program ${programCount} generated! </span>\n`;
                            outputLog += ast.toDecoratedString() + "\n";
                            console.log(ast);
                            //call generate code here
                            const code = generateCode(ast);
                            outputLog += `<span class="success">INFO Code Gen - Code successfully generated:</span>\n`;
                            outputLog += `<pre class="code">`;

                            for (let i = 0; i < code.length; i++) {
                                const hex = code[i].toString(16).toUpperCase().padStart(2, '0');
                                outputLog += hex;

                                const isEndOfRow = (i + 1) % 8 === 0;
                                const isLastByte = i === code.length - 1;

                                if (!isLastByte) {
                                    outputLog += isEndOfRow ? "\n" : " ";
                                }
                            }
                            outputLog += `</pre>\n`;
                        }

                    }
                } else {
                    outputLog += `<span class="error">ERROR Parser - Parsing failed. No CST generated.</span>\n`;

                }

            }

        }

        inputCode = remainingInput;
        line = nextLine;
        column = nextColumn;
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