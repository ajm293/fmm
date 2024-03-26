"use strict";

var state;

$(document).ready(function () {

    $("#parsed").val('');
    $("#console").val('');
    $("#output").val('');
    $("#cont").val('');
    $("#stacks").val('');
    $("#themeselect").val('classic');
    $("#rngval").val(NUM_RANGE);

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
        state = undefined;
        $("#console").val('');
        $("#output").val('');
        $("#cont").val('');
        $("#stacks").val('');
        $("#parsed").val(parse(tokenise(term)).toString());
        changeState("Running");
        run(term);
        changeState("Idle");
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
            changeState("Running");
            state = init(term);
            $("#parsed").val(parse(tokenise(term)).toString());

            $("#console").val(`${state.m.toTerm()}\n\n`);
            $("#output").val('');

            $("#cont").val(showCont(state.c));
            $("#stacks").val(showStacks(state.m0));
            return;
        } else {
            state = step(state);
            if (typeof state === "string") {
                $("#console").val($("#console").val() + `${state}\n\n`);
                state = undefined;
                changeState("Idle");
            } else {
                $("#console").val($("#console").val() + `${state.m.toTerm()}\n\n`);
                $("#stacks").val(showStacks(state.m0));
                $("#cont").val(showCont(state.c));
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
        $("#cont").val('');
        $("#upload").val('');
        state = undefined;
        changeState("Idle");
    });

    $("#reset").click(function () {
        $("#parsed").val('');
        $("#console").val('');
        $("#output").val('');
        $("#stacks").val('');
        $("#cont").val('');
        state = undefined;
        changeState("Idle");
    });

    $("#closealert").click(function () {
        $("#haze").fadeOut();
        $("#alert").fadeOut();
    });

    $("#upload").on("change", function () {
        let file = $("#upload")[0].files[0];
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function () {
            $("#term").val(reader.result);
        };
        reader.onerror = function () {
            throwAlert("Unable to read file.", "error");
        }
    });

    $("#themeselect").on("change", function () {
        changeTheme($("#themeselect").val());
    });

    $("#settings").click(function () {
        $(".options").fadeIn(100);
    });

    $("#closeoptions").click(function () {
        $(".options").fadeOut();
    });

    $("#rngval").on("change", function () {
        let temp = NUM_RANGE;
        let input = $("#rngval").val();
        console.log(input);
        if (input !== "") {
            NUM_RANGE = input;
        } else {
            throwAlert("RNG range must be a number.", "error");
            $("#rngval").val(NUM_RANGE);
        }
    });

    $("#submit-input").click(function () {

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

function showCont(c) {
    output = "";
    for (let cont in c) {
        if (c[cont].jmp === '') output += `*`; else output += `${c[cont].jmp}`;
        output += ` -> ${c[cont].term.toTerm()}\n\n`;
    }
    return output;
}

function throwAlert(text, style = "warning") {
    switch (style) {
        case "warning":
            $("#alert").css("background", "goldenrod");
            break;
        case "error":
            $("#alert").css("background", "salmon");
            break;
        case "info":
            $("#alert").css("background", "lightskyblue");
            break;
        default:
            $("#alert").css("background", "palegreen");
    }
    $("#alert-text").html(text);
    $("#haze").fadeIn(100);
    $("#alert").fadeIn(100);
}

function showInput() {
    $("#input-text").val('');
    $("#haze").fadeIn(100);
    $(".input-box").fadeIn(100);
}

function changeTheme(theme = "classic") {
    let fontColor;
    let termColor;
    let windowColor;
    let bgColor;
    let buttonColor;
    let borderColor;
    let btnFontColor;
    let txtBorderColor;
    switch (theme) {
        case "classic":
            fontColor = "black";
            termColor = "lime";
            windowColor = "black";
            bgColor = "#FFF7E4";
            buttonColor = "#F0F0F0";
            borderColor = "black";
            btnFontColor = "black";
            txtBorderColor = "transparent";
            break;
        case "light":
            fontColor = "black";
            termColor = "blue";
            windowColor = "#EAEAEA";
            bgColor = "white";
            buttonColor = "#F0F0F0";
            borderColor = "black";
            btnFontColor = "black";
            txtBorderColor = "transparent";
            break;
        case "dark":
            fontColor = "white";
            termColor = "white";
            windowColor = "#111111";
            bgColor = "#333333"
            buttonColor = "#555555";
            borderColor = "#111111";
            btnFontColor = "white";
            txtBorderColor = "transparent";
            break;
        case "hicontrast":
            fontColor = "white";
            termColor = "lime";
            windowColor = "black";
            bgColor = "black";
            buttonColor = "black";
            borderColor = "aqua";
            btnFontColor = "white";
            txtBorderColor = "aqua";
            break;
        case "testing":
            $(".pane-container").css("background-color", "tomato");
            $(".controls-container").css("background-color", "aqua");
            break;
        default:
            return;
    }
    $("body").css("color", fontColor);
    $("textarea").css("color", termColor);
    $("textarea").css("background-color", windowColor);
    $("body,html").css("background-color", bgColor);
    $("input[type=button]").css("background-color", buttonColor);
    $("input[type=button]").css("color", btnFontColor);
    $("input").css("border-color", borderColor);
    $(".pane-container").css("border-bottom-color", borderColor);
    $("textarea").css("border-color", txtBorderColor);
}

function changeState(stateString) {
    $("#running").html(stateString);
}