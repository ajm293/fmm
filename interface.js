"use strict";

var state;

$(document).ready(function () {


    $("#parsed").val('');
    $("#console").val('');
    $("#output").val('');
    $("#stacks").val('');

    $("#parse").click(function () {
        var term = $("#term").val();
        if (term === "") {
            throwAlert("FMC term is empty.");
            return;
        }
        $("#parsed").val(parse(tokenise(term)).toString());
    });

    $("#run").click(function () {
        var term = $("#term").val();
        if (term === "") {
            throwAlert("FMC term is empty.");
            return;
        }
        $("#console").val('');
        $("#output").val('');
        $("#parsed").val(parse(tokenise(term)).toString());
        run(term);
        $("#console").scrollTop($("#console")[0].scrollHeight);
        $("#output").scrollTop($("#output")[0].scrollHeight);
    });

    $("#step").click(function () {
        if (typeof state === "undefined") {
            var term = $("#term").val();
            if (term === "") {
                throwAlert("FMC term is empty.");
                return;
            }
            state = init(term);
            $("#parsed").val(parse(tokenise(term)).toString());
            $("#console").val(`${state.m.toString()}\n\n`);
            $("#output").val('');
            $("#stacks").val(showStacks(state.m0));
            return;
        } else {
            state = step(state);
            if (typeof state === "string") {
                $("#console").val($("#console").val() + `${state}\n\n`);
                state = undefined;
            } else {
                $("#console").val($("#console").val() + `${state.m.toString()}\n\n`);
                $("#stacks").val(showStacks(state.m0));
            }
            $("#console").scrollTop($("#console")[0].scrollHeight);
            $("#output").scrollTop($("#output")[0].scrollHeight);
        }
    });

    $("#resetall").click(function () {
        $("#term").val('');
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
        $("#stacks").val('');
        state = undefined;
    });

    $("#reset").click(function () {
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
        $("#stacks").val('');
        state = undefined;
    });

    $("#closealert").click(function () {
        $("#haze").fadeOut();
        $("#alert").fadeOut();
    })
});

function showStacks(m0) {
    output = "";
    for (let stack in m0) {
        if (stack == "") {
            output += "\u03BB"
        } else {
            output += stack
        }
        output += `: ${m0[stack].stack}\n\n`
    }
    return output;
}

function throwAlert(text) {
    $("#alert-text").html(text);
    $("#haze").fadeIn(100);
    $("#alert").fadeIn(100);
}