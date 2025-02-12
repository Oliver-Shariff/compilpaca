import {tokenize, Token, tokenType} from "./lexer";
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
        count errors
        count programs
    */
function formatTokens(tokens: Token[]): string{
    
}