export const ENV = {
  buildPathAbs:'/Users/alexgorm/sfa.mobile.ion/',
  buildScript:'golden-build.sh',
  unitTestScript:'golden-unit-test.sh',
  fetchPrScript:'fetch-pr.sh',
  runUnitTests:true,
  buildTrackerFilePath:'logs/_trackedBuilds.json',
  buildTriggers: ['buildit','buildapp'],
  ciPath: '/Users/alex.gorm/WebstormProjects/smee-watch-git-trigger-build',
  forceBuildtriggers: ['forcebuild', 'forcebuildit', 'forcebuildapp'],
  prodBuildTriggers: ['builditprod', 'buildappprod', 'buildprod'],
  prodBuildForceTriggers: ['forcebuilditprod', 'forcebuildappprod', 'forcebuildprod', 'forceprod'],
  pullRequestActionTriggers: ['opened', 'reopened', 'synchronize', 'ready_for_review' ],
  statusCommands: ['buildstatus'],
  strings:{
    messages: {
      forceBuild: 'To ignore warnings and build anyways, type `${COMMAND}` into a github comment.',
      queueStatus: 'Build for PR ${PR} was queued. Queue position ${QUEUE}.'
    },
    warnings: {
      alreadyBuilt: 'The latest commit ${COMMIT} for this PR already has been built by version ${VERSION} for ${ENVIRONMENT} environment.',
      changesAreRequested: 'Changes have been requested by another reviewer.',
      mergeConflicts: 'The source branch has conflicts with development branch.',
      someIssues: 'WARNING: There were some issues found when trying to run a build scripts.'
    }
  },
  debug: {
    debug_mode: false,
    localPayload: false,  // Whether to listen to webhooks
    dontComment: false,  // Whether to post to github or just log to console
    mockBuildScript: 'mock-build.sh', // Script to fire when useMockBuild script is enabled
    useMockBuildScript: false,
    mockUnitTestScript:'mock-unit-test.sh',
    useMockUnitTestScript:false,
    buildTrackerFilePath:'logs/_trackedBuildsDebug.json',
  },
  verbose: false,
  echoStandardOut: true,
  showErrors: true,
  webhookProxy:'https://smee.io/{{yourSmeeChannel}}',
  webhookSecret:'{{yourSmeeSecret}}'
}
