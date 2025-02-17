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
function handleLexing(){
    const inputElement = document.getElementById("codeInput") as HTMLTextAreaElement;
    const outputElement = document.getElementById("tokenOutput") as HTMLPreElement;
    
    const inputCode = inputElement.value;
    const tokens: Token[] =tokenize(inputCode);

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
function formatTokens(tokens: Token[]): string{
    let errorCount = 0, programCount = 1;

    let output = `INFO LEXER - Lexing program ${programCount}...\n`;

    for (const token of tokens){
        const {type, value, line, column} = token;

        if (type === tokenType.UNKNOWN){
            //add text color change here later
            output += `ERROR Lexer - Error on line:${line} col:${column} Unrecognized token: ${value}\n`;
            errorCount++;
        }
        else if(type === tokenType.QUOTE){
            output += `ERROR Lexer -  Unlosed quote ${value} on line:${line} col:${column} \n`;
            errorCount++;
        }
        else{
            output += `INFO Lexer - ${type}[ ${value} ] found at line:${line} col:${column} \n`;
        }
    }

    if(errorCount === 0){
        output += `INFO Lexer - Lex completed with 0 errors`;
    }
    else{
        output += `ERROR Lexer - Lex failed with ${errorCount} errors`;
    }
    /*
    if( type === tokenType.OPEN){
        braceOpen = true;
        
        
    }
    */
    
    return output;
}

document.addEventListener("DOMContentLoaded", () => {
    const lexButton = document.getElementById("lexButton");
    lexButton.addEventListener("click",handleLexing);
});