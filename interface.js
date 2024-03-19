"use strict";
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