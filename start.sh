# This file should be placed at the root of the project you are trying to build
# so the build script has permissions context for that directory / variables

# This should point back at where your CI "git-watch-custom-node-ci" directory outside of the project directory
CI_PATH="${HOME}/WebstormProjects/smee-watch-git-trigger-build "
# Make a logfile
LOGFILE=$(date '+build%m-%d-%YT-%H:%M.log')
touch ${CI_PATH}/logs/"${LOGFILE}"
# Start the CI at the CI path and output to log
node --trace-uncaught ${CI_PATH}/index.js 2>&1 --color | tee ${CI_PATH}/logs/"${LOGFILE}"
