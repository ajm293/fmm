"use strict";


var NUM_RANGE = 100;
var RNG_QUEUE = 5;

var inputReceived = false;
var waitingForInput = false;
var savedState = undefined;

const separator = /\(|\)|\.|\[|\]|\;/;
const alphanum = /[a-z0-9]|_/i;
const digit = /^\d+$/;
const varID = /[a-z]+$/;
const jmpID = /[A-Z][A-Za-z]+$/;

const operators = ["+", "-", "*", "/", "<=", ">=", "=="];

/**
 * Parses an FMC tokenStream into an FMC Term abstract syntax tree
 * @param {[string]} tokenStream 
 * @returns {Term} The corresponding FMC Term syntax tree
 */
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
                    return straight([new L0("", x)].concat(trace));
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
        if (sym == '\0') { // straight xs [] = up xs (J "") []
            return up(trace, new J(""));
        }
        else {
            throwAlert("Parsing error at index " + index, "error");
            throw new Error("Parsing error at index " + index);
        }
    }

    function up(trace, m) {
        if (trace.length == 0 && lookAhead() == '\0') { // up [] m [] = m
            return m;
        }

        let head = trace[0];

        if ((head instanceof P0) && (lookAhead() == ')')) { // up (P0:xs) m (")":ys) = up xs m ys
            nextToken();
            return up(trace.slice(1), m);
        }

        if ((head instanceof A0) && (lookAhead() == ']') && (lookAhead(1) == '\0')) { // up (A0:xs) m ("]":[]) = up xs (A "" m (J "")) []
            nextToken();
            return up(trace.slice(1), new A("", m, new J("")));
        }

        if ((head instanceof A0) && (lookAhead() == ']') && (lookAhead(1) != '\0')) { // up (A0:xs) m ("]":a:ys)
            if (/[a-z]+$/.test(lookAhead(1))) { // | isloc a = straight (A1 a m:xs) ys
                nextToken();
                let sym2 = nextToken();
                return straight([new A1(sym2, m)].concat(trace.slice(1)));
            } else { // | otherwise = straight (A1 "" m:xs) (a:ys)
                nextToken();
                return straight([new A1("", m)].concat(trace.slice(1)));
            }
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

        if (sym == ';' && lookAhead(1) != '->') { // up xs m (";":ys) = down (S1 m "":xs) ys
            return down([new S1(m, "")].concat(trace));
        }

        let sym2 = nextToken();

        let sym3 = nextToken();
        if (sym == ';' && sym3 == '->') { // up xs m (";":j:"->":ys) = down (S1 m j :xs) ys
            return down([new S1(m, sym2)].concat(trace));
        }

        else {
            throwAlert("Parsing error at index " + index, "error");
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
        if (index + n >= input.length) {
            return "\0";
        }
        return input[index + n];
    }
}

/**
 * Performs FMC machine steps on an input FMC term string
 * until the term is completely evaluated, or until an
 * error is encountered.
 * @param {string} input 
 */
function run(input) {
    let state;
    if (inputReceived === false) {
        state = init(input);
        updatePanes(state);
    } else {
        state = savedState;
    }
    running = true;
    while (typeof state != "string") {
        if (waitingForInput) {
            return;
        }
        state = step(state);
        if (typeof state === "string") {
            break;
        }
        updatePanes(state);
    }
    document.getElementById("console").value += (`${state}\n`);
    running = false;
}

/**
 * Performs one FMC machine step on the input state
 * @param {State} state 
 * @returns {State} The 1-stepped state
 */
function step(state) {
    var m0 = state['m0'];
    var m = state['m'];
    var c = state['c'];
    switch (true) {
        case m instanceof A:
            if (m.loc == 'out') {
                document.getElementById("output").value += (`<< ${m.pushTerm.toTerm()}\n`);
                m0[m.loc].stack.push(m.pushTerm);
                return { m0: m0, m: m.term, c: c };
            } else {
                m0[m.loc].stack.push(m.pushTerm);
                return { m0: m0, m: m.term, c: c };
            }
        case m instanceof L:
            if (m.loc == 'rnd') {
                m0['rnd'].stack.unshift(new J(Math.floor(Math.random() * NUM_RANGE)));
                let rand = m0['rnd'].stack.pop();
                return { m0: m0, m: sub(m.variable, rand, m.term), c: c };
            } else if (m.loc == 'in') {
                if (inputReceived === false) {
                    waitingForInput = true;
                    savedState = state;
                    showInput();
                    return { m0: m0, m: m, c: c }
                } else {
                    let newState = { m0: m0, m: sub(m.variable, new J(inputReceived), m.term), c: c }
                    waitingForInput = false;
                    inputReceived = false;
                    return newState;
                }
            } else {
                let popped = m0[m.loc].stack.pop();
                if (typeof popped == "undefined") return "Error: empty pop at " + (m.loc == "" ? "\u03BB" : m.loc);
                return { m0: m0, m: sub(m.variable, popped, m.term), c: c };
            }
        case m instanceof J:
            if (c.length == 0) return "Exit with status " + (m.value == "" ? "*" : m.value);
            let topJmp = c.pop();
            if (topJmp.jmp == m.value) return { m0: m0, m: topJmp.term, c };
            return { m0: m0, m: m, c: c };
        case m instanceof S:
            c.push({ jmp: m.jmp, term: m.rTerm });
            return { m0: m0, m: m.lTerm, c: c };
        case m instanceof R:
            c.push({ jmp: m.jmp, term: m });
            return { m0: m0, m: m.term, c: c };
        case m instanceof V:
            if (!operators.includes(m.value)) {
                return "Error: free variable " + m.value;
            }
            try {
                let a = Number(m0[""].stack.pop().value);
                let b = Number(m0[""].stack.pop().value);
                switch (m.value) {
                    case "+":
                        m0[""].stack.push(new J(a + b));
                        return { m0: m0, m: new J(""), c };
                    case "-":
                        m0[""].stack.push(new J(a - b));
                        return { m0: m0, m: new J(""), c };
                    case "*":
                        m0[""].stack.push(new J(a * b));
                        return { m0: m0, m: new J(""), c };
                    case "/":
                        m0[""].stack.push(new J(a / b));
                        return { m0: m0, m: new J(""), c };
                    case "<=":
                        m0[""].stack.push(new J(String(a <= b)));
                        return { m0: m0, m: new J(""), c };
                    case ">=":
                        m0[""].stack.push(new J(String(a >= b)));
                        return { m0: m0, m: new J(""), c };
                    case "==":
                        m0[""].stack.push(new J(String(a == b)));
                        return { m0: m0, m: new J(""), c };
                    default:
                        return "Error: Unimplemented operator " + m.value;
                }
            } catch (e) {
                return "Error: failed to pop two integers for operation";
            }

    }
}

/**
 * Prepares an input FMC term string for execution, 
 * returning a State object
 * @param {string} input 
 * @returns {State} Initial state consisting of location stacks, 
 * initial term, and continuation stack
 */
function init(input) {
    var term = parse(tokenise(input));
    var locs = getLocations(term);
    var locations = {};
    for (let i = 0; i < locs.length; i++) {
        locations[locs[i]] = new Loc(locs[i]);
        if (locs[i] == "rnd") {
            for (let j = 0; j < RNG_QUEUE; j++) {
                locations[locs[i]].stack.push(new J(Math.floor(Math.random() * NUM_RANGE)));
            }
        } else {
            locations[locs[i]].stack.push(new J(""));
        }
    }
    var cont = [];
    return { m0: locations, m: term, c: cont };
}

/**
 * Returns an array of locations referenced in the term, 
 * including the lambda-stack if used
 * @param {Term} term 
 * @param {*} locations 
 * @returns {[string]} Locations used in term
 */
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

/**
 * Returns an array the union of x and y
 * @param {Array} x 
 * @param {Array} y 
 * @returns {Array} x U y in set operation semantics
 */
function merge(x, y) {
    return x.concat(y.filter((item) => x.indexOf(item) < 0));
}

/**
 * Returns an array of the elements in x that are not in y
 * @param {Array} x 
 * @param {Array} y 
 * @returns {Array} x-y in set operation semantics
 */
function minus(x, y) {
    return x.filter((item) => y.indexOf(item) < 0);
}

/**
 * Returns the free variables in the input term
 * @param {Term} term 
 * @returns {[string]} Array of free variables
 */
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

/**
 * Returns an array of variables used in the input term
 * @param {Term} term 
 * @returns {[string]} Array of used variables
 */
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

/**
 * Returns a variable string that isn't in the usedVars array
 * (Works similarly to De Brujin indexing)
 * @param {[string]} usedVars 
 * @returns {string} An unusued variable identifier string
 */
function fresh(usedVars) {
    var freshVar = "x0";
    var counter = 0;
    while (usedVars.indexOf(freshVar) != -1) {
        freshVar = "x" + counter++;
    }
    return freshVar;
}

/**
 * Performs the capture-avoiding substitution q[p/variable]
 * @param {string} variable 
 * @param {Term} p 
 * @param {Term} q 
 * @returns {Term} The term q[p/variable]
 */
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

/**
 * Tokenises an input FMC term string
 * @param {string} input 
 * @returns {[string]} token stream for parsing
 */
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
            if (tok == "->" && curr == "<") {
                tokenStream.push(tok);
                tok = '';
            }
            tok += curr;
        }
    } while (index < input.length)
    if (tok != '') tokenStream.push(tok);
    return booleanConvert(tokenStream);
}

/**
 * Converts "False" and "True" in a token stream into "false"
 * and "true" for compatibility with FMC terms written for 
 * the Haskell implementation
 * @param {[string]} tokenStream 
 * @returns {[string]} JS-friendly token stream
 */
function booleanConvert(tokenStream) {
    for (let i = 0; i < tokenStream.length; i++) {
        if (tokenStream[i] === "False") tokenStream[i] = "false";
        if (tokenStream[i] === "True") tokenStream[i] = "true";
    }
    return tokenStream;
}