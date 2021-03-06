/*
Copyright 2014 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/
/* eslint-env node */
"use strict";

var fluid = require("../../src/module/fluid.js"),
    path = require("path");

fluid.loadTestingSupport();

var QUnit = fluid.registerNamespace("QUnit");
var jqUnit = fluid.registerNamespace("jqUnit");

fluid.registerNamespace("fluid.tests");

fluid.loadInContext("../../tests/test-core/testTests/js/IoCTestingTests.js");

var testModuleBase = __dirname + path.sep + "node_modules" + path.sep + "test-module";

fluid.module.preInspect(testModuleBase);

// We must store this NOW since it will be overwritten when the module is genuinely loaded - the test
// fixture will run long afterwards
var preInspected = fluid.module.modules["test-module"].baseDir;

jqUnit.test("Test early inspection of test module", function () {
    jqUnit.assertEquals("Test that base directory of test module has been successfully pre-inspected", fluid.module.canonPath(testModuleBase), preInspected);
});

fluid.require("test-module", require, "test-module");

fluid.setLogging(true);

QUnit.testDone(function (data) {
    fluid.log("Test concluded - " + data.name + ": " + data.passed + " passed, " + data.failed + " failed");
});

var expected = 20;

QUnit.done(function (data) {
    fluid.log("Infusion node.js internal tests " +
        (expected === data.passed && data.failed === 0 ? "PASSED" : "FAILED") +
        " - " + data.passed + "/" + (expected + data.failed) + " tests passed");
});

QUnit.log(function (details) {
    if (details.source) { // "white-box" inspection of qunit.js shows that it sets this field on error
        fluid.log("Message: " + details.message + "\nSource: " + details.source);
        if (details.expected !== undefined) {
            console.log("Expected: ", JSON.stringify(details.expected, null, 4));
            console.log("Actual: ", JSON.stringify(details.actual, null, 4));
        }
    }
});

fluid.test.runTests(["fluid.tests.myTestTree"]);

jqUnit.module("Non IoC tests");

jqUnit.test("Rendering truncation test", function () {
    var rendered = fluid.renderLoggingArg(fluid);
    jqUnit.assertTrue("Large object truncated", rendered.length < fluid.logObjectRenderChars + 100); // small allowance for extra diagnostic
    console.log("Large log rendering object truncated to " + rendered.length + " chars");
});

jqUnit.test("Test fluid.require support", function () {
    var testModule = fluid.registerNamespace("test-module");
    jqUnit.assertEquals("Loaded module as Fluid namespace", "Export from test-module", testModule.value);
    jqUnit.assertEquals("Loaded module as Fluid global entry", "Export from test-module", fluid.global["test-module"].value);
});

jqUnit.test("Test fluid.require diagnostics and FLUID-5906 loading", function () {
    jqUnit.expect(1);
    jqUnit.expectFrameworkDiagnostic("Module name for unloaded modules", function () {
        fluid.require("%test-module3");
    }, ["Module test-module3 has not been loaded and could not be loaded"]);
    var testModule2 = fluid.require("%test-module2");
    var rawTestModule2 = require("test-module2");
    jqUnit.assertEquals("Same module resolvable via fluid.require and require ", rawTestModule2, testModule2);
});

jqUnit.test("Test propagation of standard globals", function () {
    var expectedGlobals = ["console.log", "setTimeout", "clearTimeout", "setInterval", "clearInterval"];

    fluid.each(expectedGlobals, function (oneGlobal) {
        var type = typeof(fluid.get(fluid.global, oneGlobal));
        jqUnit.assertEquals("Global " + oneGlobal + " has type function", "function", type);
    });
});

jqUnit.test("Test module resolvePath", function () {
    var resolved = fluid.module.resolvePath("%infusion/src/components/tableOfContents/html/TableOfContents.html");
    var expected = fluid.module.canonPath(path.resolve(__dirname, "../../src/components/tableOfContents/html/TableOfContents.html"));
    jqUnit.assertEquals("Resolved path into infusion module", expected, resolved);

    var pkg = fluid.require("%test-module/package.json");
    jqUnit.assertEquals("Loaded package.json via resolved path directly via fluid.require", "test-module", pkg.name);
});

fluid.tests.expectFailure = false;

fluid.tests.addLogListener = function (listener) {
    fluid.onUncaughtException.addListener(listener, "log",
        fluid.handlerPriorities.uncaughtException.log);
};

fluid.tests.onUncaughtException = function () {
    jqUnit.assertEquals("Expected failure in uncaught exception handler",
        true, fluid.tests.expectFailure);
    fluid.onUncaughtException.removeListener("test-uncaught");
    fluid.onUncaughtException.removeListener("log");
    fluid.tests.addLogListener(fluid.identity);
    fluid.tests.expectFailure = false;
    fluid.invokeLater(function () { // apply this later to avoid nesting uncaught exception handler
        fluid.invokeLater(function () {
            fluid.onUncaughtException.removeListener("log"); // restore the original listener
            console.log("Restarting jqUnit in nested handler");
            jqUnit.start();
        });
        "string".fail(); // provoke a further global uncaught error - should be a no-op
    });
};

fluid.tests.benignLogger = function () {
    fluid.log("Expected global failure received in test case");
    jqUnit.assert("Expected global failure");
};

jqUnit.asyncTest("Test uncaught exception handler registration and deregistration", function () {
    jqUnit.expect(2);
    fluid.onUncaughtException.addListener(fluid.tests.onUncaughtException, "test-uncaught");
    fluid.tests.addLogListener(fluid.tests.benignLogger);
    fluid.tests.expectFailure = true;
    fluid.invokeLater(function () { // put this in a timeout to avoid bombing QUnit's exception handler
        "string".fail(); // provoke a global uncaught error
    });
});

jqUnit.test("FLUID-5807 noncorrupt framework stack traces", function () {
    var error = new fluid.FluidError("thing");
    jqUnit.assertTrue("Framework error is an error (from its own perspective)", error instanceof fluid.Error);
    jqUnit.assertTrue("Framework error is an instance of itself", error instanceof fluid.FluidError);
    var stack = error.stack.toString();
    jqUnit.assertTrue("Our own filename must appear in the stack", stack.indexOf("basic-node-tests") !== -1);
});

QUnit.load();
