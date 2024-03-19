"use strict";
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

    $("#resetall").click(function () {
        $("#term").val('');
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
    });

    $("#reset").click(function () {
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
    });
});