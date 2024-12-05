import { ENV } from "../environment.js";
import { runScript } from "./shell.js";

export class TestRunner {
    runUnitTests = async () => {
        const script = ENV.debug.debug_mode && ENV.debug.useMockUnitTestScript ? ENV.debug.mockUnitTestScript : ENV.unitTestScript;
        return await runScript(`${ENV.buildPathAbs}${script}`, [], true);
    }

    runE2ETests = async () => {

    }
}