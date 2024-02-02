const ex7 = "in<x>.in<y>.([y].[x].+ ; <p>.[p]out)";
const ex5 = "[Divide]out.in<x>.[by]out.in<y>. ([y].[0].== ; <z>.z ; True -> Error ; False -> [y].[x]./ ; <z>.[z]out ; Error -> [Divide_by_zero]out)";

const separator = /\(|\)|\.|\[|\]|\;/;
const alphanum = /[a-z0-9]|_/i;
const digit = /^\d+$/;
const varID = /[a-z]+$/;
const jmpID = /[A-Z][A-Za-z]+$/;

function parse(tokenStream) {
    "use strict";
    let input = tokenStream;
    let index = 0;

    let result = down([]);
    return result;

    function down(trace) {
        console.log("down", input[index], index, input.join(''));
        if (lookAhead() == '\0') {
            return up(trace, new J(""));
        }
        let sym = nextToken();
        if (sym == '(') {
            return down([new P0()].concat(trace));
        }
        if (sym == '[') {
            return down([new A0()].concat(trace));
        }
        if (sym == '<') {
            let x = nextToken();
            if (alphanum.test(x)) {
                if (nextToken() == '>') {
                    return straight ([new L0("", x)].concat(trace));
                }
            }
        }
        let l = lookAhead();
        if (l == '<') {
            nextToken();
            let x = nextToken();
            if (alphanum.test(x)) {
                if (nextToken() == '>') {
                    return straight([new L0(sym, x)].concat(trace));
                }
            }
        }
        if ([')', ']', ';'].includes(sym)) {
            tokenStream = [sym].concat(tokenStream);
            index--;
            return up(trace, new J(""));
        }
        if (/[A-Z]/.test(sym) || digit.test(sym)) {
            return up(trace, new J(sym));
        }
        else {
            return up(trace, new V(sym));
        }
    }

    function straight(trace) {
        console.log("straight", input[index], index, input.join(''));
        let sym = lookAhead();
        if (sym == '\0') {
            return up(trace, new J(""), []);
        }
        if (sym == '.') {
            nextToken();
            return down(trace);
        }
        if (sym == ')') {
            return up(trace, new J(""), [')'].concat(trace));
        }
        if (sym == ']') {
            return up(trace, new J(""), [']'].concat(trace));
        }
        if (sym == ';') {
            return up(trace, new J(""), [';'].concat(trace));
        }
    }

    function up(trace, m) {
        console.log("up", input[index], index, trace);
        if (trace.length == 0 && lookAhead() == '\0') {
            return m;
        }
        let head = trace[0];
        if (head instanceof A1) {
            trace.shift();
            return up(trace, new A(head.loc, head.term, m));
        }
        if (head instanceof L0) {
            trace.shift();
            return up(trace, new L(head.loc, head.variable, m));
        }
        if (head instanceof S1) {
            trace.shift();
            return up(trace, new S(head.term, head.jump, m));
        }
        let sym = nextToken();
        if ((head instanceof A0) && (sym == ']') && (lookAhead() == '\0')) {
            trace.shift();
            return up(trace, new A("", m, new J("")));
        }
        if ((head instanceof P0) && (sym == ')')) {
            trace.shift();
            return up(trace, m);
        }
        if (sym == '*') {
            return up(trace, new R(m, ""));
        }
        if (sym == ';' && lookAhead(1) != '->') {
            return down([new S1(m, "")].concat(trace));
        }
        console.log(sym);
        let sym2 = nextToken();
        if ((head instanceof A0) && (sym == ']') && (sym2 != '\0')) {
            trace.shift();
            if (/[a-z]+$/.test(sym2)) {
                return straight([new A1(sym2, m)].concat(trace));
            } else {
                tokenStream = [sym2].concat(tokenStream);
                index--;
                return straight([new A1("", m)].concat(trace));
            }
        }
        if (sym == '^' && sym2 != '\0') {
            return up(trace, new R(m, sym2));
        }
        let sym3 = nextToken();
        if (sym == ';' && sym3 == '->') {
            return down([new S1(m, sym2)].concat(trace));
        }
        else {
            throw new Error("idk what happened but nothing matched");
        }
    }

    function nextToken() {
        if (index >= input.length) {
            return "\0";
        }
        return input[index++];
    }
    
    function lookAhead(n = 0) {
        if (index+n >= input.length) {
            return "\0";
        }
        return input[index+n];
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