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
        return (`L(${this.loc}, ${this.variable}, ${this.term})`);
    }
}

class A { // push action (application)
    constructor(loc, pushTerm, term) {
        this.loc = loc;
        this.pushTerm = pushTerm;
        this.term = term;
    }

    toString() {
        return (`A(${this.loc}, ${this.pushTerm}, ${this.term})`);
    }
}

class J { // jump (terminal)
    constructor(value) {
        this.value = value;
    }

    toString() {
        return (`J(${this.value})`);
    }
}

class S { // jump action (sequence)
    constructor(lTerm ,jmp, rTerm) {
        this.lTerm = lTerm;
        this.jmp = jmp;
        this.rTerm = rTerm;
    }

    toString() {
        return (`S(${this.lTerm}, ${this.jmp}, ${this.rTerm})`);
    }
}

class R { // loop (recurse)
    constructor(term, jmp) {
        this.term = term;
        this.jmp = jmp;
    }

    toString() {
        return (`R(${this.term}, ${this.jmp})`);
    }
}