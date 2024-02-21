// Final Program AST classes

class V { // variable (terminal)
    constructor(value) {
        this.value = value;
    }

    toString() {
        return (`V(${this.value})`);
    }
}

class L { // pop action (lambda-abstraction)
    constructor(loc, variable, term) {
        this.loc = loc;
        this.variable = variable;
        this.term = term;
    }

    toString() {
        let loc = this.loc;
        if (loc == '') loc = 'lambda';
        return (`L(${loc}, ${this.variable}, ${this.term})`);
    }
}

class A { // push action (application)
    constructor(loc, pushTerm, term) {
        this.loc = loc;
        this.pushTerm = pushTerm;
        this.term = term;
    }

    toString() {
        let loc = this.loc;
        if (loc == '') loc = 'lambda';
        return (`A(${loc}, ${this.pushTerm}, ${this.term})`);
    }
}

class J { // jump (terminal)
    constructor(value) {
        this.value = value;
    }

    toString() {
        let value = this.value;
        if (value == '') value = '*';
        return (`J(${value})`);
    }
}

class S { // jump action (sequence)
    constructor(lTerm ,jmp, rTerm) {
        this.lTerm = lTerm;
        this.jmp = jmp;
        this.rTerm = rTerm;
    }

    toString() {
        let jmp = this.jmp;
        if (jmp == '') jmp = '*'
        return (`S(${this.lTerm}, ${jmp}, ${this.rTerm})`);
    }
}

class R { // loop (recurse)
    constructor(term, jmp) {
        this.term = term;
        this.jmp = jmp;
    }

    toString() {
        let jmp = this.jmp;
        if (jmp == '') jmp = '*';
        return (`R(${this.term}, ${jmp})`);
    }
}

// Helper AST classes for parsing as informed by Haskell implementation

class P0 {

}

class A0 {

}

class A1 {
    constructor(loc, term) {
        this.loc = loc;
        this.term = term;
    }
}

class L0 {
    constructor(loc, variable) {
        this.loc = loc;
        this.variable = variable;
    }
}

class S1 {
    constructor(term, jump) {
        this.term = term;
        this.jump = jump;
    }
}