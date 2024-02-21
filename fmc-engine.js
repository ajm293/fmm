"use strict";
const ex7 = "in<x>.in<y>.([y].[x].+ ; <p>.[p]out)";
const ex5 = "[Divide]out.in<x>.[by]out.in<y>. ([y].[0].== ; <z>.z ; True -> Error ; False -> [y].[x]./ ; <z>.[z]out ; Error -> [Divide_by_zero]out)";

const NUM_RANGE = 10;

const separator = /\(|\)|\.|\[|\]|\;/;
const alphanum = /[a-z0-9]|_/i;
const digit = /^\d+$/;
const varID = /[a-z]+$/;
const jmpID = /[A-Z][A-Za-z]+$/;

$(document).ready(function() {
    $("#parsed").val('');
    $("#console").val('');
    $("#output").val('');

    $("#parse").click(function () {
        var term = $("#term").val();
        $("#parsed").val(parse(tokenise(term)).toString());
    });

    $("#run").click(function () {
        var term = $("#term").val();
        $("#console").val('');
        $("#output").val('');
        run(term);
        $("#console").scrollTop($("#console")[0].scrollHeight);
        $("#output").scrollTop($("#output")[0].scrollHeight);
    });

    $("#reset").click(function () {
        $("#term").val('');
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
    });
});

function parse(tokenStream) {
    let input = tokenStream;
    let index = 0;

    let result = down([]);
    return result;

    function down(trace) {
        if (lookAhead() == '\0') { // down xs [] = up xs (J "") []
            return up(trace, new J(""));
        }
        let sym = nextToken();
        if (sym == '(') { // down xs ("(":ys) = down (P0:xs) ys
            return down([new P0()].concat(trace));
        }
        if (sym == '[') { // down xs ("[":ys) = down (A0:xs) ys
            return down([new A0()].concat(trace));
        }
        if (sym == '<') { // down xs ("<":x:">":ys) = straight (L0 "" x:xs) ys
            let x = nextToken();
            if (alphanum.test(x)) {
                if (nextToken() == '>') {
                    return straight ([new L0("", x)].concat(trace));
                }
            }
        }
        let l = lookAhead();
        if (l == '<') { // down xs (a:"<":x:">":ys) = straight (L0  a x:xs) ys
            nextToken();
            let x = nextToken();
            if (alphanum.test(x)) {
                if (nextToken() == '>') {
                    return straight([new L0(sym, x)].concat(trace));
                }
            }
        }
        if ([')', ']', ';'].includes(sym)) { // down xs (x:ys) | closing x = up xs (J "") (x:ys)
            index = index - 1;
            return up(trace, new J(""));
        }
        if (/[A-Z]/.test(sym) || digit.test(sym)) { // down xs (x:ys) | isjump  x = up xs (J x) ys
            return up(trace, new J(sym));
        }
        else { // down xs (x:ys) | otherwise = up xs (V x) ys
            return up(trace, new V(sym));
        }
    }

    function straight(trace) {
        let sym = lookAhead();
        if (sym == '\0') { // straight xs [] = up xs (J "") []
            return up(trace, new J(""));
        }
        if (sym == '.') { // straight xs (".":ys) = down xs ys
            nextToken();
            return down(trace);
        }
        if (sym == ')') { // straight xs (")":ys) = up xs (J "") (")":ys)
            return up(trace, new J(""));
        }
        if (sym == ']') { // straight xs ("]":ys) = up xs (J "") ("]":ys)
            return up(trace, new J(""));
        }
        if (sym == ';') { // straight xs (";":ys) = up xs (J "") (";":ys)
            return up(trace, new J(""));
        }
        else {
            throw new Error("Parsing error at index " + index);
        }
    }

    function up(trace, m) {
        if (trace.length == 0 && lookAhead() == '\0') { // up [] m [] = m
            return m;
        }
        if (lookAhead() == '*') { // up xs m ("*":ys) = up xs (R m "") ys
            nextToken();
            return up(trace, new R(m, ""));
        }
        if (lookAhead() == '^' && lookAhead(1) != '\0') { // up xs m ("^":j:ys) = up xs (R m j) ys
            nextToken();
            let sym2 = nextToken();
            return up(trace, new R(m, sym2));
        }
        let head = trace[0];
        if (head instanceof A1) { // up (A1 a n:xs) m ys = up xs (A a n m) ys
            return up(trace.slice(1), new A(head.loc, head.term, m));
        }
        if (head instanceof L0) { // up (L0 a x:xs) m ys = up xs (L a x m) ys
            return up(trace.slice(1), new L(head.loc, head.variable, m));
        }
        if (head instanceof S1) { // up (S1 n j:xs) m ys = up xs (S n j m) ys
            return up(trace.slice(1), new S(head.term, head.jump, m));
        }
        let sym = nextToken();
        if ((head instanceof A0) && (sym == ']') && (lookAhead() == '\0')) { // up (A0:xs) m ("]":[]) = up xs (A "" m (J "")) []
            return up(trace.slice(1), new A("", m, new J("")));
        }
        if ((head instanceof P0) && (sym == ')')) { // up (P0:xs) m (")":ys) = up xs m ys
            return up(trace.slice(1), m);
        }
        
        if (sym == ';' && lookAhead(1) != '->') { // up xs m (";":ys) = down (S1 m "":xs) ys
            return down([new S1(m, "")].concat(trace));
        }
        let sym2 = nextToken();
        if ((head instanceof A0) && (sym == ']') && (sym2 != '\0')) { // up (A0:xs) m ("]":a:ys)
            if (/[a-z]+$/.test(sym2)) { // | isloc a = straight (A1 a m:xs) ys
                return straight([new A1(sym2, m)].concat(trace.slice(1)));
            } else { // | otherwise = straight (A1 "" m:xs) (a:ys)
                index = index - 1;
                return straight([new A1("", m)].concat(trace.slice(1)));
            }
        }
        
        let sym3 = nextToken();
        if (sym == ';' && sym3 == '->') { // up xs m (";":j:"->":ys) = down (S1 m j :xs) ys
            return down([new S1(m, sym2)].concat(trace));
        }
        else {
            throw new Error(`Parsing error at index ${index}`);
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

function run(input) {
    let state = init(input);
    while (typeof state != "string") {
        console.log(state.m.toString());
        document.getElementById("console").value += (`${state.m.toString()}\n`);
        state = step(state);
    }
    console.log(state);
    document.getElementById("console").value += (`${state}\n`);
}

function step(state) {
    var m0 = state['m0'];
    var m = state['m'];
    var c = state['c'];
    switch (true) {
        case m instanceof A:
            if (m.loc == 'out') {
                console.log("<< " + m.pushTerm.toString());
                document.getElementById("output").value += (`<< ${m.pushTerm.toString()}\n`);
                return {m0: m0, m: m.term, c: c};
            } else {
                m0[m.loc].stack.push(m.pushTerm);
                return{m0: m0, m: m.term, c: c};
            }
        case m instanceof L:
            if (m.loc == 'rnd') {
                let rand = Math.floor(Math.random() * NUM_RANGE);
                return {m0: m0, m: sub(m.variable, new J(rand), m.term), c: c};
            } else if (m.loc == 'in') {
                let userInput = prompt(">> ");
                document.getElementById("putput").value += (`>> ${userInput}\n`);
                return {m0: m0, m: sub(m.variable, new J(userInput), m.term), c: c};
            } else {
                let popped = m0[m.loc].stack.pop();
                if (typeof popped == "undefined") return "Error: empty pop at " + m.loc;
                return {m0: m0, m: sub(m.variable, popped, m.term), c: c};
            }
        case m instanceof J:
            if (c.length == 0) return "Exit with status " + (m.value == "" ? "*" : m.value);
            let topJmp = c.pop();
            if (topJmp.jmp == m.value) return {m0: m0, m: topJmp.term, c};
            return {m0: m0, m: m, c: c};
        case m instanceof S:
            c.push({jmp: m.jmp, term: m.rTerm});
            return {m0: m0, m: m.lTerm, c: c};
        case m instanceof R:
            c.push({jmp: m.jmp, term: m});
            return {m0: m0, m: m.term, c: c};
        case m instanceof V:
            let a = Number(m0[""].stack.pop().value);
            let b = Number(m0[""].stack.pop().value);
            switch (m.value) {
                case "+":
                    m0[""].stack.push(new J(a + b));
                    return {m0: m0, m: new J(""), c};
                case "-":
                    m0[""].stack.push(new J(a - b));
                    return {m0: m0, m: new J(""), c};
                case "*":
                    m0[""].stack.push(new J(a * b));
                    return {m0: m0, m: new J(""), c};
                case "/":
                    m0[""].stack.push(new J(a / b));
                    return {m0: m0, m: new J(""), c};
                case "<=":
                    m0[""].stack.push(new J(String(a <= b)));
                    return {m0: m0, m: new J(""), c};
                case ">=":
                    m0[""].stack.push(new J(String(a >= b)));
                    return {m0: m0, m: new J(""), c};
                case "==":
                    m0[""].stack.push(new J(String(a == b)));
                    return {m0: m0, m: new J(""), c};
                default:
                    return "Error: free variable " + m.value;
            }
    }
}

function init(input) {
    var term = parse(tokenise(input));
    var locs = getLocations(term);
    var locations = {};
    for (let i = 0; i < locs.length; i++) {
        locations[locs[i]] = new Loc(locs[i]);
        locations[locs[i]].stack.push(new J(""));
    }
    var cont = [];
    return {m0: locations, m: term, c: cont};
}

function getLocations(term, locations = []) {
    switch (true) {
        case term instanceof L:
            if (locations.indexOf(term.loc) === -1) locations.push(term.loc);
            getLocations(term.term, locations);
            break;
        case term instanceof A:
            if (locations.indexOf(term.loc) === -1) locations.push(term.loc);
            getLocations(term.pushTerm, locations);
            getLocations(term.term, locations);
            break;
        case term instanceof S:
            getLocations(term.lTerm, locations)
            getLocations(term.rTerm, locations);
            break;
        case term instanceof R:
            getLocations(term.term, locations);
            break;
    }
    return locations;
}

function merge(x, y) {
    return x.concat(y.filter((item) => x.indexOf(item) < 0));
}

function minus(x, y) {
    return x.filter((item) => y.indexOf(item) < 0);
}

function free(term) {
    switch (true) {
        case term instanceof V:
            return [term.value];
        case term instanceof L:
            return minus(free(term.term), [term.variable]);
        case term instanceof A:
            return merge(free(term.pushTerm), free(term.term));
        case term instanceof J:
            return [];
        case term instanceof S:
            return merge(free(term.lTerm), free(term.rTerm));
        case term instanceof R:
            return free(term.term);
    }
}

function used(term) {
    switch (true) {
        case term instanceof V:
            return [term.value];
        case term instanceof L:
            return merge(used(term.term), [term.variable]);
        case term instanceof A:
            return merge(used(term.pushTerm), used(term.term));
        case term instanceof J:
            return [];
        case term instanceof S:
            return merge(used(term.lTerm), used(term.rTerm));
        case term instanceof R:
            return used(term.term);
    }
}

function fresh(usedVars) {
    var freshVar = "x0";
    var counter = 0;
    while (usedVars.indexOf(freshVar) != -1) {
        freshVar = "x" + counter++; 
    }
    return freshVar;
}

function sub(variable, p, q) {
    switch (true) {
        case q instanceof J:
            return q;
        case q instanceof V:
            if (q.value == variable) {
                return p;
            } else return q;
        case q instanceof S:
            return new S(sub(variable, p, q.lTerm), q.jmp, sub(variable, p, q.rTerm));
        case q instanceof R:
            return new R(sub(variable, p, q.term), q.jmp);
        case q instanceof A:
            return new A(q.loc, sub(variable, p, q.pushTerm), sub(variable, p, q.term));
        case q instanceof L:
            if (q.variable == variable) {
                return q;
            } else if (free(p).indexOf(q.variable) != -1) {
                // TODO: Implement fresh variables (De Bruijn indexing ideally)
                var z = fresh(merge([variable], merge(used(p), used(q.term))));
                return new L(q.loc, z, sub(variable, p, sub(q.variable, new V(z), q.term)));
            } else {
                return new L(q.loc, q.variable, sub(variable, p, q.term));
            }
    }
}

class Loc {
    constructor(name) {
        this.name = name;
        this.stack = [];
    }
}

function tokenise(input) {
    input = input.split(/\s/).join("");
    let index = 0;
    const tokenStream = [];
    let tok = '';
    do {
        const curr = input[index++];
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