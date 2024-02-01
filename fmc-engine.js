const ex7 = "in<x>.in<y>.([y].[x].+ ; <p>.[p]out)";

const separator = /\(|\)|\.|\[|\]|\;/;
const alphanum = /[a-z0-9]|_/i;
const digit = /^\d+$/;
const varID = /[a-z]+$/;
const jmpID = /[A-Z][A-Za-z]+$/;

function parse(tokenStream) {
    "use strict";
    let input = tokenStream;
    let index = 0;
    return parse();
    function parse() {
        let result = term();
        return result;
    }
    function term () {
        let sym = nextToken();
        console.log(`Processing token ${sym} as term`);
        if (sym == '(') {
            // loopback and check
        }
        if (sym == '[') {
            // push action
        } else if (sym == '<') {
            // pop action on lambda stack
            return popAction("");
        } else if (sym == ';') {
            // jump action
        } else if (sym == '^') {
            // loop
        } else if (alphanum.test(sym)) {
            // jump if Capitalised or digit
            // variable or pop location if lowercase
            if (digit.test(sym) || jmpID.test(sym)) {
                // jump
            } else if (varID.test(sym)) {
                if (lookAhead() == '<') {
                    // pop action on location
                    nextToken();
                    return popAction(sym);
                } else {
                    return variable(sym);
                }
            }
        } else if (sym == '\0') {
            console.log("We have reached the end");
            return variable("");
        }
        // How do we handle brackets?
    }
    function pushAction() {
        // [TERM]loc.TERM
        // nextToken() should be the start of a TERM
        
    }
    function popAction(location) {
        // loc<var>.TERM
        // nextToken() should be a variable
        let a = location;
        let x = variable(nextToken());
        let rangle = nextToken();
        let dot = nextToken();
        if (rangle == '>' && dot == '.') {
            let m = term();
            return new L(a, x, m);
        }
    }
    function jumpAction() {
        // TERM ; jump -> TERM
        // nextToken() should be a Jump
    }
    function loop() {
        // TERM^jump
        // nextToken() should be a Jump
    }
    function variable(x) { // Terminal
        return new V(x);
    }
    function jump() { // Terminal

    }
    function nextToken() {
        if (index >= input.length) {
            return "\0";
        }
        return input[index++];
    }
    function lookAhead() {
        if (index+1 >= input.length) {
            return "\0";
        }
        return input[index];
    }
    function error() {
        console.error(`Error at token ${index}`);
        throw new Error("Parsing error");
    }
}

function step() {

}

function run() {

}

function init() {
    
}

function tokenise(input) {
    input = input.split(/\s/).join("");
    let index = 0;
    const tokenStream = [];
    let tok = '';
    do {
        curr = input[index++];
        if (separator.test(curr)) { // Separator characters
            if (tok != '') {
                tokenStream.push(tok);
                tok = '';
            }
            tokenStream.push(curr);
        } else if (alphanum.test(curr)) { // Alphanumeric identifiers
            if (!(alphanum.test(tok)) && tok != '') {
                tokenStream.push(tok);
                tok = '';
            }
            tok += curr;
        } else { // Non-alphanumeric cohesive features: operators, <, >, ^, and ->
            if (alphanum.test(tok) && tok != '') {
                tokenStream.push(tok);
                tok = '';
            }
            tok += curr;
        }
    } while (index < input.length)
    if (tok != '') tokenStream.push(tok);
    return tokenStream;
}