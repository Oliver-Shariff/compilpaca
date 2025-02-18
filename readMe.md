
## Compilpaca

#### Welcome to Compilpaca- a compiler for Alan++ written by Oliver Shariff

# HEY ALAN - PLEASE GRADE THE MAIN BRANCH


In its current state this program performs lexical analysis on input code. Per professor's request node is not comitted. However a CORS issue may occur if opening index.html in the browser. I use the live server feature in VSCode to avoid this.

To see my thoughts and notes throughout this project you can read my commits, comments, and devNotes.txt.

Here are some test cases:

### lex without spaces:

    {intaa=1print(a)booleanbb=true}$

### multiple strings with some missing quotes:

    {intaa=1print("hello world)booleanbb=true}{intaa=1print("hello world)booleanbb=true}$

### comment inside string (strings are sacred):

    {print("hello/**/")}$

### Unterminated comment, multi-digit number, missing EOP:

    {
        int a
        a = 13543218
        string s
        s = "ha"/*
    }$
    {
        int b
        b = 4
        string s
        s = "hey"
    }

### 