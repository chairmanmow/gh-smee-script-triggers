import { ENV } from "../environment.js";
import { canMergePR, getPRHead, noChangesRequested } from "./git.js";
import chalk from 'chalk';

export class Hooks {

  processComment = async (event) => {
    const payload = event?.payload || event;
    const prNum = payload.issue.number;
    const action = payload.action;
    const isEdited = action !== "created";
    const command = payload.comment?.body?.split(" ")[0].trim();
    const isAutoTrigger = !!ENV.buildTriggers.find(keyword => keyword === command);
    const forceBuild = !!ENV.forceBuildtriggers.find(keyword => keyword === command) || !!ENV.prodBuildForceTriggers.find(keyword => keyword === command);
    const statusRequest = !!ENV.statusCommands.find(keyword => keyword === command);
    const production = !!ENV.prodBuildTriggers.find(keyword => keyword === command) || !!ENV.prodBuildForceTriggers.find(keyword => keyword === command);;
    const ignoreComment = isEdited || (!isAutoTrigger && !forceBuild && !production && !statusRequest);
    if (ignoreComment) {
      return console.log(chalk.black.bgWhite("\r\n*** Ignoring comment! *** \r\n"), `${ENV.verbose ? payload.comment.body + "\r\n" : ""}`);
    } else {
      console.log(chalk.bgCyan.black("\r\nProcessing comment command ---> "),"\"", chalk.yellowBright(command), "\"");
    }
    const commit = await getPRHead(prNum);
    const canMerge = await canMergePR(prNum);
    const noChangeRequests = await noChangesRequested(prNum);
    const buildInfo = {
      prNum,
      isAutoTrigger,
      canMerge,
      noChangeRequests,
      action,
      commit,
      production,
      forceBuild,
      statusRequest
    };
    return buildInfo;
  };

  processPREvent = async (event) => {
    const payload = event?.payload || event;
    const action = payload.action;
    const prNum = payload.number;
    const commit = payload.pull_request.head.sha;
    const branch = payload.pull_request.head.ref;
    const isAutoTrigger = !!ENV.pullRequestActionTriggers.find(trigger => action === trigger);
    if(!isAutoTrigger){
      return console.log(`PR Action: "${action} ignored"`)
    }
    const canMerge = await canMergePR(prNum);
    const noChangeRequests = await noChangesRequested(prNum);
    const buildInfo = {
      branch,
      prNum,
      isAutoTrigger,
      canMerge,
      noChangeRequests,
      action,
      commit,
      production: false,
      forceBuild: false
    };
    return buildInfo; // processBuildInfo(buildInfo);
  };
}
