"use strict";

var state;

$(document).ready(function() {

    
    $("#parsed").val('');
    $("#console").val('');
    $("#output").val('');
    $("#stacks").val('');

    $("#parse").click(function () {
        var term = $("#term").val();
        if (term ==="") {
            alert("FMC term is empty.");
            return;
        }
        $("#parsed").val(parse(tokenise(term)).toString());
    });

    $("#run").click(function () {
        var term = $("#term").val();
        if (term ==="") {
            alert("FMC term is empty.");
            return;
        }
        $("#console").val('');
        $("#output").val('');
        run(term);
        $("#console").scrollTop($("#console")[0].scrollHeight);
        $("#output").scrollTop($("#output")[0].scrollHeight);
    });

    $("#step").click(function () {
        if (typeof state === "undefined") {
            var term = $("#term").val();
            if (term === "") {
                alert("FMC term is empty.");
                return;
            }
            state = init(term);
            $("#console").val($("#console").val() + `${state.m.toString()}\n\n`);
            $("#stacks").val(showStacks(state.m0));
            return;
        } else {
            state = step(state);
            $("#console").val($("#console").val() + `${state.m.toString()}\n\n`);
            $("#stacks").val(showStacks(state.m0));
            $("#console").scrollTop($("#console")[0].scrollHeight);
            $("#output").scrollTop($("#output")[0].scrollHeight);
        }
    });

    $("#resetall").click(function () {
        $("#term").val('');
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
        state = undefined;
    });

    $("#reset").click(function () {
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
        $("#stacks").val('');
        state = undefined;
    });
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