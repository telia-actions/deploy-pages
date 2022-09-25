const core = require('@actions/core')
const axios = require('axios')
const axiosRetry = require('axios-retry')
const { createProxyAgent } = require('./create-proxy-agent')

const retryAttempt = 3
const proxyAgent = createProxyAgent()

axiosRetry(axios, {
  retries: retryAttempt,
  retryDelay: retryCount => {
    core.info(`retrying to send pages telemetry with attempt: ${retryCount}`)
    return retryCount * 1000 // time interval between retries, with 1s, 2s, 3s
  },

  // retry on error greater than 500
  retryCondition: error => {
    return error.response.status >= 500
  }
})

const { Deployment } = require('./deployment')

async function emitTelemetry() {
  // All variables we need from the runtime are set in the Deployment constructor
  const deployment = new Deployment()
  const telemetryUrl = `${deployment.githubApiUrl}/repos/${deployment.repositoryNwo}/pages/telemetry`
  const conclusion = core.getInput('conclusion') || null
  core.info(`Sending telemetry for run id ${deployment.workflowRun}: ${conclusion}`)
  await axios
    .post(
      telemetryUrl,
      { github_run_id: deployment.workflowRun, conclusion },
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${deployment.githubToken}`,
          'Content-type': 'application/json'
        },
        proxy: false,
        httpsAgent: proxyAgent
      }
    )
    .catch(err => {
      if (err.response.status !== 200) {
        throw new Error(
          `failed to emit metric with status code: ${err.response.status} after ${retryAttempt} retry attempts`
        )
      }
    })
}

async function main() {
  try {
    await emitTelemetry()
  } catch (error) {
    core.error('failed to emit pages build telemetry')
  }
}

main()

module.exports = { emitTelemetry }
