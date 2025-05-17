
## Compilpaca

### Welcome to Compilpaca 
### ...a compiler for Alan++ written by Oliver Shariff

#### This program performs lexical analysis, parsing, semantic analysis and code gen for programs written in Alan++. Consult language_grammar.pdf for an overview of the language. Test cases for each stage of compilation are written below.

## CODE GEN

## Int expression with variable inside print statement

    {
        int a a = 1
        print(3+5 + 1)
    }$

## Chained string aliasing and comparison

    {
      string a
      string b
      string c
        string d
      a = "yes"
      b = a
        d = b
      c = "no"
      if (d == b) {
        print(" d matches b ")
      }
      if (a != c) {
        print("a is different from c")
      }
    }$


## if nested in while

    {
      boolean f
      int i
      i = 0
      f = true
      if (f == true) {
        while (i != 3) {
          print(i)
          i = 1+i
        }
      }
      print("finished")
    }$


### nested if inside while

    {
      int x
      int y
      x = 1
      y = 5
      while (x != y) {
        if (x == 3) {
          print("three")
        }
        x = 1 = x
      }
      print("done")
    }$


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



