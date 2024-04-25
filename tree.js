// Final Program AST classes

class V { // variable (terminal)
    constructor(value) {
        this.value = value;
    }

    toTerm(indent=0) {
        return (`${"  ".repeat(indent)}V(${this.value})`);
    }

    toString() {
        return this.value;
    }
}

class L { // pop action (lambda-abstraction)
    constructor(loc, variable, term) {
        this.loc = loc;
        this.variable = variable;
        this.term = term;
    }

    toTerm(indent=0) {
        let loc = this.loc;
        if (loc === '') loc = '\u03BB';
        return (`${"  ".repeat(indent)}L(${loc}, ${this.variable},\n${this.term.toTerm(indent+1)})`);
    }

    toString() {
        return `${this.loc}<${this.variable}>.${this.term.toString()}`;
    }
}

class A { // push action (application)
    constructor(loc, pushTerm, term) {
        this.loc = loc;
        this.pushTerm = pushTerm;
        this.term = term;
    }

    toTerm(indent=0) {
        let loc = this.loc;
        if (loc === '') loc = '\u03BB';
        return (`${"  ".repeat(indent)}A(${loc},\n${this.pushTerm.toTerm(indent+1)},\n${this.term.toTerm(indent+1)})`);
    }

    toString() {
        return `[${this.pushTerm.toString()}]${this.loc}.${this.term.toString()}`;
    }
}

class J { // jump (terminal)
    constructor(value) {
        this.value = value;
    }

    toTerm(indent=0) {
        let value = this.value;
        if (value === '') value = '*';
        return (`${"  ".repeat(indent)}J(${value})`);
    }

    toString() {
        if (this.value === '') return "*";
        return this.value;
    }
}

class S { // jump action (sequence)
    constructor(lTerm ,jmp, rTerm) {
        this.lTerm = lTerm;
        this.jmp = jmp;
        this.rTerm = rTerm;
    }

    toTerm(indent=0) {
        let jmp = this.jmp;
        if (jmp === '') jmp = '*'
        return (`${"  ".repeat(indent)}`
        +`S(\n${this.lTerm.toTerm(indent+1)},\n`
        +`${"  ".repeat(indent+1)}${jmp},\n${this.rTerm.toTerm(indent+1)})`);
    }

    toString() {
        if (this.jmp === '') return `${this.lTerm.toString()};${this.rTerm.toString()}`;
        return `${this.lTerm.toString()};${this.jmp}->${this.rTerm.toString()}`;
    }
}

class R { // loop (recurse)
    constructor(term, jmp) {
        this.term = term;
        this.jmp = jmp;
    }

    toTerm(indent=0) {
        let jmp = this.jmp;
        if (jmp === '') jmp = '*';
        return (`${"  ".repeat(indent)}`
        +`R(\n${this.term.toTerm(indent+1)},\n${"  ".repeat(indent+1)}${jmp})`);
    }

    toString() {
        if (this.jmp === '') return `(${this.term.toString()})^*${this.jmp}`
        return `(${this.term.toString()})^${this.jmp}`;
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