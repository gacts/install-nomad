const core = require('@actions/core') // docs: https://github.com/actions/toolkit/tree/main/packages/core
const tc = require('@actions/tool-cache') // docs: https://github.com/actions/toolkit/tree/main/packages/tool-cache
const github = require('@actions/github') // docs: https://github.com/actions/toolkit/tree/main/packages/github
const io = require('@actions/io') // docs: https://github.com/actions/toolkit/tree/main/packages/io
const exec = require('@actions/exec') // docs: https://github.com/actions/toolkit/tree/main/packages/exec

// read action inputs
const input = {
  version: core.getInput('version', {required: true}),
  githubToken: core.getInput('github-token'),
}

// main action entrypoint
async function run() {
  let versionToInstall;

  if (input.version.toLowerCase() === 'latest') {
    core.debug('Requesting latest nomad version...')
    versionToInstall = await getLatestNomadVersion(input.githubToken)
  } else {
    versionToInstall = input.version
  }

  core.startGroup('💾 Install Nomad')
  core.info(`Nomad version to install: ${versionToInstall}`)
  const nomadZipPath = await tc.downloadTool(getNomadURI(process.platform, process.arch, versionToInstall))
  const extractedPath = await tc.extractZip(nomadZipPath, nomadZipPath + '-dist');
  core.debug(`Add ${extractedPath} to the $PATH`)
  core.addPath(extractedPath)
  core.endGroup()

  core.startGroup('🧪 Installation check')
  const nomadPath = await io.which('nomad', true)
  core.info(`Nomad installed: ${nomadPath}`)
  core.setOutput('nomad-bin', nomadPath)
  await exec.exec(`"${nomadPath}"`, ['version'], {silent: true})
  core.endGroup()
}

/**
 * @param {string} githubAuthToken
 * @returns {Promise<string>}
 */
async function getLatestNomadVersion(githubAuthToken) {
  const octokit = github.getOctokit(githubAuthToken)

  // docs: https://octokit.github.io/rest.js/v18#repos-get-latest-release
  const latest = await octokit.rest.repos.getLatestRelease({
    owner: 'hashicorp',
    repo: 'nomad',
  })

  return latest.data.tag_name.replace(/^v/, '') // strip the 'v' prefix
}

/**
 * @link https://www.nomadproject.io/downloads
 *
 * @param {('linux'|'darwin'|'win32')} platform
 * @param {('x32'|'x64'|'arm'|'arm64')} arch
 * @param {string} version E.g.: `1.2.6`
 *
 * @returns {string}
 *
 * @throws
 */
function getNomadURI(platform, arch, version) {
  switch (platform) {
    case 'linux': {
      switch (arch) {
        case 'x32': // 386
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_linux_386.zip`

        case 'x64': // Amd64
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_linux_amd64.zip`

        case 'arm': // Arm
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_linux_arm.zip`

        case 'arm64': // Arm64
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_linux_arm64.zip`
      }

      throw new Error('Unsupported linux architecture')
    }

    case 'darwin': {
      if (arch === 'x64') { // Amd64
        return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_darwin_amd64.zip`
      }

      throw new Error('Unsupported MacOS architecture')
    }

    case 'win32': {
      switch (arch) {
        case 'x32': // 386
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_windows_386.zip`

        case 'x64': // Amd64
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_windows_amd64.zip`
      }

      throw new Error('Unsupported windows architecture')
    }
  }

  throw new Error('Unsupported OS (platform)')
}

// run the action
try {
  run()
} catch (error) {
  core.setFailed(error.message)
}
