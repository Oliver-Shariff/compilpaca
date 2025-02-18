
## Compilpaca

### Welcome to Compilpaca- a compiler for Alan++ written by Oliver Shariff

# HEY ALAN - PLEASE GRADE THE MAIN BRANCH


In its current state this program performs lexical analysis on input code. Per professor's request node is not comitted. However a CORS issue may occur if opening index.html in the browser. I use the live server feature in VSCode to avoid this.

To see my thoughts and notes throughout this project you can read my commits, comments, and **devNotes.txt**.

## Here are some test cases:

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

### Full grammar test case

    {  
        int a = 0  
        boolean b = true  
        string c = "hello "  
        
        if (a == 0) {  
            print c 
        }  
        
        while (b == true) {  
            a = a + 1  
            if (a == 10) {  
                b = false  
            }  
        }  
        
        /* this is a comment */  
    }$  

### Lots of quotes - but an even number

    {print("""""""")}$

### Bad types and string that's just spaces

    {int a = ""
    char b = 12
    if (a + b == c){
    print("       ")}
    }$

### some more
    /*oddly placed EOP*/
    {}${$}${}$

    /*spaces between type and variable name*/
    int     a = 10$

    /*unexpected symbol*/
    int var@name = 5$

    /*multiple intOP*/
    x = 5 ++ 3$

    /*newline inside string*/
    print "hello
    world"$



