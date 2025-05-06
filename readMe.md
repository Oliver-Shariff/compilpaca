
## Compilpaca

### Welcome to Compilpaca- a compiler for Alan++ written by Oliver Shariff

# HEY ALAN - PLEASE GRADE THE MAIN BRANCH


In its current state this program performs lexical analysis and parsing on input code. Per professor's request node is not comitted. However a CORS issue may occur if opening index.html in the browser. I use the live server feature in VSCode to avoid this.

To see my thoughts and notes throughout this project you can read my commits, comments, and **devNotes.txt**.

## CODE GEN 

### If statement string comparison

    { string a string b
        a = "hi"
        b = a
        if(b != a){
            print("true")
            }
        print("false")
    }$


### Nested assignment and print
    {
    int a 
    a = 3+4+5+6 
        { 
            int b
            b = a
            print (b)
        }
        {
            print (a)
        }
    string c
    c = "hello"
    string d
    d = c
    print(c)
    print("hi")
    print(d)
    }$

## Semantic Analysis - AST test cases

### Parallel scopes
    {
        {int a int b }
        {int a }
    int a
        {int c}
    }$


### Nested assignment statements
    {
        boolean d
        d = (true == (true == false))
        d = (a == b)
        d = (1 == a)
        d = ("string" == 1)
        d = (a != "string")
        d = ("string" != "string")
    }$

### Chained addition

    {
      int x
      x = 1 + 2 + 3
    }$

### Compare in print

    {
      print((1 == 1))
      print((x != 5))
    }$

### Nested blocks

    {
      int a
      {
        int b
        b = 2
        print(b)
      }
    }$

### Variable addition

    {
        int a
        a = 1
        int b
        b = 2
        b = 3 + a
    }$

### Print every type of expression

    {
        int b
        b = 1
        print((1==1))
        print(b)
        print(1+1)
        print(1)
    }$


## PARSE test cases:

### Boolean Expression with boolval argurment

    {
        int a
        a = 1
        if (a != 2)
            {
                print("hi")
            }
    }$

### Boolean Expression with BoolOp and Assignment

    {
        int a
        int b
        int c
        a = 4
        c = 1 + 2
        if (a == c){
            print ("hi")
        }
    }$

### Int Op on two Ids (parse fail)
    {
        int a
        int b
        int c
        a = 4
        b = 1
        c = a + b
    }$

### Missing paren in print statement (parse fail)

    { print("hello" }$

### Invalid int operation (parse fail)

    { 5 + 1}$

### Expressions inside print argument

    { print(5 + (x == y)) }$


## LEX test cases:

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



