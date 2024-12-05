import fs from "fs";
import { ENV } from "../environment.js";

export const loadBuildRecords = async () =>{
  return await new Promise((resolve,reject) => {
      fs.readFile(buildTrackFilePath(), 'utf8', (err,data) => {
        let toRtn;
        if(err){
          toRtn = {};
          fs.writeFile(buildTrackFilePath(), JSON.stringify(toRtn), 'utf8', (err2,data2) => {
            if(err2) reject(err);
            if(data2) resolve(toRtn);
          })
        } else {
          resolve(JSON.parse(data));
        }
      })
  });
}

export const getExistingBuilds = async () => {
  return await loadBuildRecords();
};

export const updateBuildRecords = async (buildRecords) => {
  return await new Promise((resolve, reject) => {
    fs.writeFile(buildTrackFilePath(), JSON.stringify(buildRecords), 'utf8', (err,data) => {
      if(err) {
        reject(err);
      } else {
        resolve(data || true)
      }
    })
  })
}

export const getVersionNumEnvVariable = async () => {
  return await new Promise((resolve, reject) => {
    fs.readFile(`${ENV.buildPathAbs}.env`, 'utf8', (err,data) => {
      if(err) reject(err);
      if(data) {
        const vars = data.toString().split('\n');
        const version = vars.find(variable =>{
          return variable.split('=')[0] === 'NEWVERS';
        }).split('=')[1]
        resolve(version);
      }
    })
  })
}
const buildTrackFilePath = () => {
  return `${ENV.ciPath}/${ENV.debug.debug_mode ? ENV.debug.buildTrackerFilePath : ENV.buildTrackerFilePath}`
}
