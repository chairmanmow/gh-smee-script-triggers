import { postComment } from "./git.js";
import { ENV } from "../environment.js";
import chalk from 'chalk';

export class Report {
  constructor(jobQueue, currentBuild, buildCount, appStarted) {
    this.jobQueue = jobQueue,
      this.currentBuild = currentBuild,
      this.buildCount = buildCount,
      this.appStarted = appStarted;
  }

  generateStatusReport = (prNum) => {
    const isCurrent = prNum === this.currentBuild?.prNum;
    const position = isCurrent ? 0 : this.jobQueue.findIndex(buildInfo => buildInfo?.prNum === prNum) + 1;
    const next = this.jobQueue[0];
    let comment = '### :desktop_computer: CURRENT BUILD STATUS: ';
      comment += !!this.currentBuild ? ` :green_circle: There are ${this.jobQueue.length} builds queued. ` : " :red_circle: Nothing is building.";
    if (!!this.currentBuild) {
      comment += " :speech_balloon: "
      comment += isCurrent ? `Currently building this Pull request, #${prNum}` : `PR#${this.currentBuild?.prNum} is building`;
      if (!isCurrent && position !== 1 && position) comment += `This PR#${prNum} is ${position} in the queue`;
      if (position === 1 && this.jobQueue.length > 0) {
        comment += ` :soon: This PR#${prNum} will be built next. `;
      } else {
        if (this.jobQueue.length > 1) {
          comment += `:soon: PR#${next?.prNum}`;
        }
      }
    }
    comment += '\r\n***\r\nSERVER STATS:\r\n' + this.uptime() + this.buildStats();
    postComment(prNum, comment).then(r => {
    });
  };

  generateRejectedBuildFeedback = (buildInfo, comment) => {
    console.log(chalk.bgBlueBright(`Generating a reason for build rejection for PR# ${buildInfo.prNum}`));
    let str = ENV.strings.warnings.someIssues;
    let warnings = [];
    if (buildInfo.existingVersion) {
      warnings.push(
        ENV.strings.warnings.alreadyBuilt
          .replace("${COMMIT}", buildInfo.commit)
          .replace("${VERSION}", buildInfo.existingVersion)
          .replace("${ENVIRONMENT}", buildInfo.production ? "Production" : "Staging")
      );
    }
    if (!buildInfo.canMerge) {
      warnings.push(ENV.strings.warnings.mergeConflicts);
    }
    if (!buildInfo.noChangeRequests) {
      warnings.push(ENV.strings.warnings.changesAreRequested);
    }
    for (let i = 0; i < warnings.length; i++) {
      str += ("\r\n" + (i + 1).toString() + ". " + warnings[i]);
    }
    str += "\r\n" + ENV.strings.messages.forceBuild.replace(
      "${COMMAND}", buildInfo.production ? "forcebuildprod" : "forcebuild"
    );
    if (comment) {
      postComment(buildInfo.prNum, str).then(r => {
      });
    }
    return str;
  };

  notifyFailures = (failures, buildInfo) => {
    console.log(chalk.bgBlueBright(`Generating a failure log for PR# ${buildInfo.prNum}`));
    let msg = '';
    if(buildInfo.buildNum) {
      msg += `### :triangular_flag_on_post: Some errors happened building your PR #${buildInfo.prNum} for commit_env hash ${buildInfo.hash}. `;
    }
    if(failures.indexOf('build_failed') > - 1){
      msg += '\r\n### :warning: :skull_and_crossbones: A fatal error happened preventing builds from finishing. Check logs for info.  This error means your build didn\'t make it through to the end, and you will need to rebuild using the `buildit` or `forcebuild` command.'
    } else {
      msg += `\r\n#### :white_check_mark: :hammer_and_wrench: Your build completed as version # ${buildInfo.buildNum}, but other warnings were found.`;
    }
    if(failures.indexOf('build_cleanup_error') > - 1){
      msg += '\r\n#### :warning: :broom: The build server had difficulties during post build steps'
    }
    if(failures.indexOf('unit_tests_failed') > - 1){
      msg += '\r\n#### :warning: :x: Unit Tests failed!'
    } else {
      msg += '\r\n#### :white_check_mark: Unit Tests passed.'
    }
    if(failures.indexOf('e2e_tests_failed') > - 1){
      msg += '\r\n#### :warning: :x: E2E Tests did not pass.'
    } else {
      msg += '\r\n#### :white_check_mark: E2E passed.'
    }
    postComment(buildInfo.prNum, msg)
  }
  
  uptime = () => {
    return ' #### :stopwatch: Uptime ' + humanizeMS(new Date() - this.appStarted) + '. ';
  }
  buildStats = () => {
    return `\r\n#### :hammer_and_wrench: Total builds: ${this.buildCount.total}\r\n##### :recycle: Forced Builds: ${this.buildCount.forced} \r\n##### :performing_arts: Staging builds: ${this.buildCount.staging}  \r\n##### :moneybag: Production builds: ${this.buildCount.prod} `
  }

  setCurrentBuildAndQueue = (currentBuild,jobQueue) => {
    this.currentBuild = currentBuild;
    this.jobQueue = jobQueue;
  }
}

const humanizeMS = (msInterval) => {
    var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(msInterval / cd),
      h = Math.floor( (msInterval - d * cd) / ch),
      m = Math.round( (msInterval - d * cd - h * ch) / 60000),
      pad = function(n){ return n < 10 ? '0' + n : n; };
    if( m === 60 ){
      h++;
      m = 0;
    }
    if( h === 24 ){
      d++;
      h = 0;
    }
    const myTime = d + ' days. ' + pad(h) + ' hours and ' + pad(m) + ' minutes.'
    return myTime;
}
