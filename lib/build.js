import { runScript } from "./shell.js";
import { getVersionNumEnvVariable, updateBuildRecords } from "./file.js";
import { ENV } from "../environment.js";
import { Report } from "./reports.js";
import { TestRunner } from "./test-runner.js";
import chalk from 'chalk';
import { getPRHead } from "./git.js";

export class Builder {
  constructor(existingBuilds) {
    this.existingBuilds = existingBuilds;
    this.buildCount = { total: 0, staging: 0, prod: 0, forced: 0, errors: 0 };
    this.building = false;
    this.jobQueue = [];
    this.currentBuild = null;
    this.report = new Report(this.jobQueue, this.currentBuild, this.buildCount, new Date());
    this.testRunner = new TestRunner();
  }

  processBuildInfo = async (buildInfo) => {
    if (!buildInfo) return;
    console.log(chalk.yellowBright('\r\n------------\r\n'), chalk.bgYellowBright.black('\r\nPROCESSING BUILD INFO FOR PULL REQUEST#' + buildInfo.prNum + '\r\n'), chalk.white(JSON.stringify(buildInfo), chalk.yellowBright('\r\n------------\r\n')));
    if (buildInfo.statusRequest) {
      console.log('Generating Status report');
      return this.report.generateStatusReport(buildInfo.prNum);
    }
    buildInfo.hash = this.getBuildHash(buildInfo);
    if (!buildInfo.forceBuild && this.alreadyBuilt(buildInfo)) {
      buildInfo.existingVersion = this.existingBuilds[getBuildHash(buildInfo)];
      return this.report.generateRejectedBuildFeedback(buildInfo, true);
    }
    if (this.shouldBuild(buildInfo)) {
      console.log(chalk.yellow(`Checking whether to proceed with build for PR # ${buildInfo.prNum}`));
      return await this.proceedWithBuild(buildInfo);
    } else {
      return this.report.generateRejectedBuildFeedback(buildInfo, true);
    }
  }

  shouldBuild = (buildInfo) => {
    const { isAutoTrigger, canMerge, noChangeRequests, forceBuild, production } = buildInfo;
    return !isQueued && !!((forceBuild) || (isAutoTrigger && canMerge && noChangeRequests));
  };

  shouldBuild = (buildInfo) => {
    const isQueued = this.jobQueue.find(build => { return build.hash === buildInfo.hash }) || this.currentBuild?.hash === buildInfo.hash;
    const { isAutoTrigger, canMerge, noChangeRequests, forceBuild, production } = buildInfo;
    return !!forceBuild || ((!isQueued && !forceBuild) || (isAutoTrigger && canMerge && noChangeRequests));
  };

  alreadyBuilt = (buildInfo) => {
    const hash = this.getBuildHash(buildInfo);
    return !!this.existingBuilds[hash];
  };

  proceedWithBuild = (buildInfo) => {
    console.log(chalk.yellowBright.bgMagenta(`\r\nChecking whether the queue is empty and build should proceed for PR#${buildInfo.prNum}`))
    if (!this.building) {
      console.log(chalk.bgGreen.black(`No build in progress.  Proceeding. Starting build for PR# ${buildInfo.prNum}\r\n`))
      this.startBuild(buildInfo).then(() => { });
    } else {
      this.queueJob(buildInfo);
      console.log(chalk.bgYellowBright.black(`Queuing build for PR# ${buildInfo.prNum}. Queue size ${this.jobQueue.length}`));
    }
    return buildInfo;
  };

  startBuild = async (buildInfo) => {
    this.building = true;
    let failures = [];
    try {
      await this.fetchPR(buildInfo);
    } catch(err){
      failures.push('couldnt_fetch_source_code')
    }
    try {
      await this.testRunner.runUnitTests();
      console.log(chalk.green('Unit tests passed'))
    } catch (err2) {
      failures.push('unit_tests_failed')
      console.log(chalk.bgRedBright('unit tests failed:\r\n'.toUpperCase()), chalk.grey(JSON.stringify(err2)));
    }
    try {
      this.setCurrentBuild(buildInfo);
      await this.runBuild(buildInfo);
    } catch (err) {
      // TODO: use unique exit codes to specify where build failed
      console.log(chalk.bgRedBright('build failed:\r\n'.toUpperCase()), chalk.grey(JSON.stringify(err)));
      delete this.existingBuilds[buildInfo];
      failures.push('build_failed');
    }
    try {
      buildInfo = await this.finalizeBuild(buildInfo);
    } catch (err) {
      failures.push('build_cleanup_error')
    }
    // TODO: e2e tests
    if (failures.length > 0) {
      this.report.notifyFailures(failures, buildInfo);
    }
  };

  queueJob = (buildInfo) => {
    this.jobQueue.push(buildInfo);
  };

  fetchPR = async (buildInfo) => {
    return await runScript(`${ENV.buildPathAbs}${ENV.fetchPrScript}`, [buildInfo.prNum], true)
  };

  setCurrentBuild = (val) => {
    this.currentBuild = val;
    this.report.setCurrentBuildAndQueue(this.currentBuild, this.jobQueue);
  };

  runBuild = async (buildInfo) => {
    const { prNum, production } = buildInfo;
    const params = production ? [prNum, "true"] : [prNum];
    const script = ENV.debug.debug_mode && ENV.debug.useMockBuildScript ? ENV.debug.mockBuildScript : ENV.buildScript;
    const buildHash = this.getBuildHash(buildInfo);
    this.existingBuilds[buildHash] = 'pending';
    const buildResult = await runScript(`${ENV.buildPathAbs}${script}`, params, true);
    return buildResult;
  }

  finalizeBuild = async (buildInfo) => {
    this.building = false;
    this.setCurrentBuild(null);
    this.trackBuildStats(buildInfo);
    const newBuildNumber = await getVersionNumEnvVariable();
    console.log(chalk.cyanBright('Got new build #'), chalk.yellowBright(newBuildNumber));
    const buildHash = this.getBuildHash(buildInfo);
    this.existingBuilds[buildHash] = newBuildNumber.toString();
    buildInfo.buildNum = newBuildNumber;
    await updateBuildRecords(this.existingBuilds);
    if (this.jobQueue.length > 0) {
      console.log(chalk.bgMagentaBright.black(`Processing next PR in queue #${this.jobQueue[0].prNum}`));
      let nextBuildInfo = this.jobQueue.shift()
      nextBuildInfo.commit = await getPRHead(nextBuildInfo.prNum);
      nextBuildInfo.hash = this.getBuildHash(nextBuildInfo);
      // Filter out redundant jobs in the queue.
      this.jobQueue = this.jobQueue.filter(item => item.prNum !== nextBuildInfo.prNum || (item.prNum === nextBuildInfo.prNum && item?.prod !== nextBuildInfo?.prod))
      this.startBuild(nextBuildInfo).then(() => { });
    } else {
      console.log(chalk.bgMagenta.black("Queue is empty. Done running builds."));
    }
    return buildInfo;
  };

  getBuildHash = (buildInfo) => {
    return `pr${buildInfo.prNum}_${buildInfo.commit}${buildInfo.production ? "_p" : ""}`;
  };

  trackBuildStats = (buildInfo) => {
    if (buildInfo.production) {
      this.buildCount.prod++
    } else {
      this.buildCount.staging++;
    }
    if (buildInfo.forceBuild) {
      this.buildCount.forced++;
    }
    this.buildCount.total++;
  }
}

const getBuildHash = (buildInfo) => {
  return `pr${buildInfo.prNum}_${buildInfo.commit}${buildInfo.production ? "_p" : ""}`;
};


