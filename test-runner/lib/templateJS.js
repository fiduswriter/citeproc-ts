var config = %%CONFIG%%
const chaiModule = await import(%%CHAI_PATH%%);
const chai = chaiModule.default;
const { createSys } = await import(%%RUNPREP_PATH%%);
const Sys = await createSys(config);
const assert = chai.assert;
var logger_queue = [];

describe('Integration tests', function() {
    after(function() {
        setTimeout(
            function() {
                for (var entry of logger_queue) {
                    process.stdout.write(entry+"\n");
                }
            }, 100)
    });
    Object.keys(config.testData).map(k => config.testData[k]).forEach(function(test) {
        var description = test.DESCRIPTION;
        if (!description) {
            description = "should pass"
        }
        if (config.styleCapabilities && config.styleCapabilities.log) {
            logger_queue = logger_queue.concat(config.styleCapabilities.log);
        }
        test["STYLE-CAPABILITIES"] = config.styleCapabilities;
        it(description + ' ' + test.NAME, function() {
            var sys = new Sys(config, test, logger_queue);
            sys.preloadAbbreviationSets(config);
            var ret = sys.run();
            try{
                assert.equal(ret, test.RESULT);
            } catch (err) {
                err.message = test.PATH
                throw err
            }
        });
    });
});
