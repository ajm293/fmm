function parse() {

}

function step() {

}

function run() {

}

function init() {
    
}

const ex7 = "in<x>.in<y>.([y].[x].+ ; <p>.[p]out)"

function tokenise(input) {
    input = input.split(/\s/).join("");
    let index = 0;
    const tokenStream = [];
    let tok = '';
    do {
        curr = input[index++];
        if (/\(|\)|\.|\[|\]|\;/.test(curr)) { // Separator characters
            if (tok != '') {
                tokenStream.push(tok);
                tok = '';
            }
            tokenStream.push(curr);
        } else if (/[a-z0-9]|_/ig.test(curr)) { // Alphanumeric identifiers
            if (!(/[a-z0-9]|_/ig.test(tok)) && tok != '') {
                tokenStream.push(tok);
                tok = '';
            }
            tok += curr;
        } else { // Non-alphanumeric cohesive features <, >, and ->
            if (/[a-z0-9]|_/ig.test(tok) && tok != '') {
                tokenStream.push(tok);
                tok = '';
            }
            tok += curr;
        }
    } while (index < input.length)
    if (tok != '') tokenStream.push(tok);
    return tokenStream;
}