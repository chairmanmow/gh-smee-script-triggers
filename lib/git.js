import { runScript } from "./shell.js";
import { ENV } from "../environment.js";
import chalk from 'chalk';

export const fetchPRProperty = async (prNum, prop) => {
  return await runScript('gh',['pr', 'view', '--json', prop, '--jq',`.${prop}`, prNum])
}

export const postComment = async (prNum, comment) => {
  comment =' #### :robot: :t-rex: :speech_balloon: GRIMLOCK (bot) SAYS: \r\n***\r\n' + comment;
  if(ENV.debug.debug_mode && ENV.debug.dontComment){
    return console.log(chalk.bgBlue(`PR# ${prNum}, posted github comment:\r\n`), chalk.blueBright(comment));
  }
  return await runScript('gh',['pr', 'comment', prNum, '-b', comment])
}

export const canMergePR = async (prNum) => {
  let status = await fetchPRProperty(prNum,'mergeable');
  const handleStatus = async (statusResponse) => {
    statusResponse = statusResponse?.trim();
    if(statusResponse === 'UNKNOWN'){
      console.log('Waiting 5 seconds for github to update merge status')
      await new Promise(r => setTimeout(r,5000));
      status = await fetchPRProperty(prNum,'mergeable');
      return await handleStatus(status);
    } else {
      return status = statusResponse;
    }
  }
  await handleStatus(status);
  return status === 'MERGEABLE';
}

export const noChangesRequested = async (prNum) => {
  // APPROVED | REVIEW_REQUIRED | CHANGES_REQUESTED
  const changeStatus = await fetchPRProperty(prNum,'reviewDecision');
  return changeStatus?.trim() !== 'CHANGES_REQUESTED';
}

export const getPRHead = async (prNum) => {
  const commit = await fetchPRProperty(prNum,'headRefOid');
  return commit.trim();
}
