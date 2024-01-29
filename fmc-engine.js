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
            tokenStream.push(curr);
        } else if (/[a-z0-9]/i.test(curr)) { // Alphanumeric identifiers
            while (/[a-z0-9]/i.test(curr)) {
                tok += curr;
                curr = input[index++];
            } 
            tokenStream.push(tok);
            tok = '';
            index--;
        } else { // Non-alphanumeric cohesive features <, >, and ->
            while (!(/[a-z0-9]/i.test(curr) || /\(|\)|\.|\[|\]|\;/.test(curr))) {
                tok += curr;
                curr = input[index++];
            }
            tokenStream.push(tok);
            tok = '';
            index--;
        }
    } while (index < input.length)
    return tokenStream;
}