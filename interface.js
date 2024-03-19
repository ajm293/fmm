"use strict";

var state;

$(document).ready(function() {

    
    $("#parsed").val('');
    $("#console").val('');
    $("#output").val('');

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
            return;
        } else {
            state = step(state);
            $("#console").val($("#console").val() + `${state.m.toString()}\n\n`);
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
    });
});