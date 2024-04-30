// This software uses the jQuery library, which is
// licensed under the MIT License.
// See http://www.opensource.org/licenses/mit-license for details.

"use strict";

var state;
var running = false;
var stepping = false;

/**
 * Prepares UI elements for use and defines the UI functions.
 * Runs on page load.
 */
$(document).ready(function () {

    $("#parsed").val('');
    $("#console").val('');
    $("#output").val('');
    $("#cont").val('');
    $("#stacks").val('');
    $("#themeselect").val('classic');
    $("#rngval").val(RNG_RANGE);
    $("#rngqueue").val(RNG_QUEUE);
    $("#exprun").prop("checked", false);
    machineControlsOff(false);

    $("#parse").click(function () {
        var term = $("#term").val();
        if (term === "") {
            throwAlert("FMC term is empty.");
            return;
        }
        $("#parsed").val(parse(tokenise(term)).toTerm());
    });

    $("#run").click(function () {
        uiRun();
    });

    $("#step").click(function () {
        uiStep();
    });

    $("#resetall").click(function () {
        $("#term").val('');
        $("#upload").val('');
        resetPanes();
        state = undefined;
        running = false;
        stepping = false;
        waitingForInput = false;
        inputReceived = false;
        savedState = undefined;
        changeState("Idle");
    });

    $("#reset").click(function () {
        resetPanes();
        state = undefined;
        running = false;
        stepping = false;
        waitingForInput = false;
        inputReceived = false;
        savedState = undefined;
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

    $("#help").click(function () {
        $(".help").fadeIn(100);
    })

    $("#closehelp").click(function () {
        $(".help").fadeOut();
    });

    $("#closefooter").click(function () {
        $(".footer").fadeOut();
    })

    $("#rngval").on("change", function () {
        let input = $("#rngval").val();
        if (input !== "") {
            RNG_RANGE = input;
        } else {
            throwAlert("RNG range must be a number.", "error");
            $("#rngval").val(RNG_RANGE);
        }
    });

    $("#rngqueue").on("change", function () {
        RNG_QUEUE = $("#rngqueue").val();
    })

    $("#exprun").on("change", function () {
        if ($("#exprun").is(":checked")) {
            EXPERIMENTAL_RUN = true;
        } else {
            EXPERIMENTAL_RUN = false;
        }
    })

    $("#submit-input").click(function () {
        $("#haze").hide();
        $(".input-box").hide();
        inputReceived = $("#input-text").val();
        waitingForInput = false;
        if (running) {
            run();
        } else if (stepping) {
            state = savedState;
            uiStep();
        } else {
            throwAlert("Inconsistent application state.", "error");
            throw new Error("Inconsistent application state.");
        }
    });
});

/**
 * Wraps the engine step function for use within the interface.
 */
function uiStep() {
    if (typeof state === "undefined") {
        var term = $("#term").val();
        if (term === "") {
            throwAlert("FMC term is empty.");
            return;
        }
        state = init(term);
        changeState("Stepping");
        stepping = true;
        $("#parsed").val(parse(tokenise(term)).toTerm());
        $("#console").val('');
        $("#output").val('');

        updatePanes(state);
        return;
    } else {
        state = step(state);
        if (typeof state === "string") {
            $("#console").val($("#console").val() + `${state}\n\n`);
            state = undefined;
            changeState("Idle");
            stepping = false;
        } else {
            updatePanes(state);
        }

    }
}

/**
 * Wraps the engine run function for use in the interface.
 */
function uiRun() {
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
    $("#parsed").val(parse(tokenise(term)).toTerm());

    changeState("Running");
    running = true;
    run(term);

    $("#console").scrollTop($("#console")[0].scrollHeight);
    $("#output").scrollTop($("#output")[0].scrollHeight);
}

function machineControlsOff(bool) {
    $(".machine-ctrl").prop("disabled", bool);
}

/**
 * Listens for Ctrl+\ and attempts to stop running
 * if detected.
 */
var down = {};
$(document).keydown(function (e) {
    down[e.keyCode] = true;
}).keyup(function (e) {
    if (down[17] && down[220] && waitingForInput === false && running === true) {
        running = false;
        state = undefined;
    }
    down[e.keyCode] = false;
})

/**
 * Clears the UI output windows
 */
function resetPanes() {
    $("#parsed").val('');
    $("#console").val('');
    $("#stacks").val('');
    $("#cont").val('');
    $("#output").val('');
}

/**
 * Updates the UI output windows to the input state
 * @param {State} s 
 */
function updatePanes(s) {
    if (waitingForInput === false) {
        $("#console").val($("#console").val() + `${s.m.toString()}\n\n`);
    }
    $("#stacks").val(showStacks(s.m0));
    $("#cont").val(showCont(s.c));
    $("#console").scrollTop($("#console")[0].scrollHeight);
    $("#output").scrollTop($("#output")[0].scrollHeight);
    $("#parsed").val(s.m.toTerm());
}

/**
 * Generates a formatted string containing the contents of the location stacks
 * @param {Object} m0 
 * @returns The formatted stack contents string
 */
function showStacks(m0) {
    let output = "";
    for (let stack in m0) {
        if (stack == "") {
            output += "\u03BB"
        } else {
            output += stack
        }
        output += `: ${m0[stack].stack.join(', ')}\n\n`
    }
    return output;
}

/**
 * Generates a formatted string containing the contents of the continuation stack
 * @param {*} c 
 * @returns The formatted continuation stack string
 */
function showCont(c) {
    let output = "";
    for (let i = c.length - 1; i >= 0; i--) {
        if (c[i].jmp === '') output += `*`; else output += `${c[i].jmp}`;
        output += ` -> ${c[i].term.toString()}\n\n`;
    }
    return output;
}

/**
 * Shows a custom modal alert window to the user
 * @param {*} text 
 * @param {*} style 
 */
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

/**
 * Shows the input window to the user
 */
function showInput() {
    $("#input-text").val('');
    $("#haze").fadeIn(100);
    $(".input-box").fadeIn(100);
    $("#input-text").focus();
}

/**
 * Changes the UI theme to the requested theme
 * @param {*} theme 
 */
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
        default:
            return;
    }
    $("body").css("color", fontColor);
    $("textarea").css("color", termColor);
    $("textarea").css("background-color", windowColor);
    $("body,html").css("background-color", bgColor);
    $("input[type=button]").css("background-color", buttonColor);
    $("input[type=button]").css("color", btnFontColor);
    $("#up-btn").css("background-color", buttonColor);
    $("#up-btn").css("color", btnFontColor)
    $("input").css("border-color", borderColor);
    $("#up-btn").css("border-color", borderColor);
    $(".pane-container").css("border-bottom-color", borderColor);
    $("textarea").css("border-color", txtBorderColor);
}

/**
 * Updates the machine state indicator to the input string
 * @param {*} stateString 
 */
function changeState(stateString) {
    $("#running").html(stateString);
}