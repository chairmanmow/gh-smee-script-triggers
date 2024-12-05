import { runScript } from "./shell.js";
import http from "http";
import { Hooks } from "./hooks.js";
import createHandler from "github-webhook-handler";
import { ENV } from "../environment.js";

const handler = createHandler({ path: "/webhook", secret: ENV.webhookSecret });
export const startServer = (builder) => {
  let hooks = new Hooks();
  _initializeSmeeSocketConnection();
  _createWebServer();
  _createHandlers(hooks, builder);
};
const _initializeSmeeSocketConnection = async () => {
  console.log("connecting to proxy socket for forwarding webhooks from github @" + ENV.webhookProxy);
  try{
    await runScript("smee", ["-u", ENV.webhookProxy, "--path", "/webhook", "--port", "7777"])
   } catch(err){
      console.error("SMEE CONNECT ERROR\r\n" + JSON.stringify(err));
   }
};

const _createWebServer = () => {
  http.createServer((req, res) => {
    handler(req, res, (err, data) => {
      if(ENV.verbose) console.log("recevied request " + JSON.stringify(req));
      res.statusCode = 404;
      res.end("no such location");
    });
  }).listen(7777);
};

const _createHandlers = (hooks, builder) => {
  handler.on("error", function(err) {
    console.error("Error:", err.message);
  });

  handler.on("issue_comment", function(event) {
    const payload = event?.payload || event;
    if(ENV.verbose) console.log("Received an issue_comment\r\n", JSON.stringify(event));
    console.log(`## Received ${payload.action} comment from @${payload.comment.user.login}:\r\n ${payload.comment.body}`);
    hooks.processComment(event).then((buildInfo)=>{
      builder.processBuildInfo(buildInfo);
    });
  });

  handler.on("pull_request", function(event) {
    const payload = event?.payload || event;
    if(ENV.verbose) console.log("Received a pull request\r\n", JSON.stringify(event));
    console.log(`## Received ${payload.action} action on PR#${payload.pull_request.number} from user @${payload.pull_request.user.login}.`);
    hooks.processPREvent(event).then((buildInfo)=>{
      builder.processBuildInfo(buildInfo);
    });
  });

};
