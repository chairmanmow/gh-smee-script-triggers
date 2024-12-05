import { ENV } from "../environment.js";
import { spawn, exec } from 'node:child_process';
import chalk from 'chalk';

export const run_script = (command, args, shell = false, callback) => {
  // if (verbose || ENV.verbose) console.log(`\r\nExecuting: ${command} ${args.join(" ")}`.yellow);
  const options = !!shell ? { shell: '/bin/sh' } : null;
  if(!!options?.shell){
    console.log(chalk.bgCyan('SHELL SCRIPT'))
    command = command + " " + args.join(' ');
  } else {
    console.log(chalk.bgBlueBright('BINARY COMMAND'))
  }
  let child;
  if(!!options) {
    child = spawn(command,options, args)
  } else {
    child = spawn(command, args);
  }
  // let child = exec(`${command} ${args.join(' ')}`);
  let stdoutChunks = [], stderrChunks = [];
  console.log(chalk.blue('Running shell command'), chalk.cyan('-->'), chalk.cyanBright(`${command} ${args.join(' ')}`));

  child.on('exit', (code) => {
    if (code) {
      console.log(chalk.redBright(`${chalk.bgWhite.red('DONE EXECUTING PROCESS')} ${chalk.cyan(command)} ${chalk.cyan(args.join(' '))} exited with code:`, chalk.yellow(code)));
      const stderrContent = Buffer.concat(stderrChunks).toString();
      callback(stderrContent, null, code)
    } else {
      console.log(chalk.green(`${chalk.bgWhite.green('DONE EXECUTING PROCESS')} ${chalk.cyan(command)} ${chalk.cyan(args.join(' '))} exited with code:`, chalk.yellow(code)));
      const stdoutContent = Buffer.concat(stdoutChunks).toString();
      callback(null, stdoutContent, false)
    }
  });

  child.stdout.on('data', (data) => {
    if(ENV.echoStandardOut) console.log('stdout:', data.toString());
    stdoutChunks = stdoutChunks.concat(data);
  });

  child.stdout.on('end', () => {
    var stdoutContent = Buffer.concat(stdoutChunks).toString();
    if (stdoutContent.length > 0) {
      console.log(chalk.bgGreenBright(`[SUCCESS]`), chalk.cyan(`Spawned Process`), chalk.white(`${command} ${args.join(' ')}`), chalk.cyan(`stdout chars:`), stdoutContent.length);
      console.log('stdout:',chalk.green(stdoutContent));
    }
  });

  child.stderr.on('data', (data) => {
    stderrChunks = stderrChunks.concat(data);
  });

  child.stderr.on('end', () => {
    var stderrContent = Buffer.concat(stderrChunks).toString();
    if (stderrContent.length > 0) {
      console.log(`${chalk.bgRedBright("[ERROR]")} ${chalk.cyan("running spawned Process")} ${chalk.white(command)} ${chalk.white(args.join(' '))} ${chalk.cyan("stderr chars:")}`, stderrContent.length);
      console.log('stderr:',chalk.red(stderrContent));
    }
  })
};

export const runScript = async (command, args, shellCommand = false) => {
  return await new Promise((resolve, reject) => {
    run_script(command, args, shellCommand, (err, data, code) => {
      if (code) {
        reject(code);
      } else {
        resolve(data);
      }
    });
  })
};