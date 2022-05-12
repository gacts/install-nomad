const core = require('@actions/core') // docs: https://github.com/actions/toolkit/tree/main/packages/core
const tc = require('@actions/tool-cache') // docs: https://github.com/actions/toolkit/tree/main/packages/tool-cache
const github = require('@actions/github') // docs: https://github.com/actions/toolkit/tree/main/packages/github
const io = require('@actions/io') // docs: https://github.com/actions/toolkit/tree/main/packages/io
const cache = require('@actions/cache') // docs: https://github.com/actions/toolkit/tree/main/packages/cache
const exec = require('@actions/exec') // docs: https://github.com/actions/toolkit/tree/main/packages/exec
const path = require('path')
const os = require('os')

// read action inputs
const input = {
  version: core.getInput('version', {required: true}).replace(/^v/, ''), // strip the 'v' prefix
  githubToken: core.getInput('github-token'),
}

// main action entrypoint
async function runAction() {
  let version

  if (input.version.toLowerCase() === 'latest') {
    core.debug('Requesting latest nomad version...')
    version = await getLatestNomadVersion(input.githubToken)
  } else {
    version = input.version
  }

  core.startGroup('💾 Install Nomad')
  await doInstall(version)
  core.endGroup()

  core.startGroup('🧪 Installation check')
  await doCheck()
  core.endGroup()
}

/**
 * @param {string} version
 *
 * @returns {Promise<void>}
 *
 * @throws
 */
async function doInstall(version) {
  const pathToInstall = path.join(os.tmpdir(), `nomad-${version}`)
  const cacheKey = `nomad-cache-${version}-${process.platform}-${process.arch}`

  core.info(`Version to install: ${version} (target directory: ${pathToInstall})`)

  let restoredFromCache = undefined

  try {
    restoredFromCache = await cache.restoreCache([pathToInstall], cacheKey)
  } catch (e) {
    core.warning(e)
  }

  if (restoredFromCache !== undefined) { // cache HIT
    core.info(`👌 Nomad restored from cache`)
  } else { // cache MISS
    const nomadZipPath = await tc.downloadTool(
      getNomadURI(process.platform, process.arch, version), path.join(os.tmpdir(), `nomad.tmp`),
    )
    await tc.extractZip(nomadZipPath, pathToInstall)

    try {
      await cache.saveCache([pathToInstall], cacheKey)
    } catch (e) {
      core.warning(e)
    }
  }

  core.addPath(pathToInstall)
}

/**
 * @returns {Promise<void>}
 *
 * @throws
 */
async function doCheck() {
  const nomadBinPath = await io.which('nomad', true)

  if (nomadBinPath === "") {
    throw new Error('nomad binary file not found in $PATH')
  }

  core.info(`Nomad installed: ${nomadBinPath}`)
  core.setOutput('nomad-bin', nomadBinPath)

  await exec.exec('nomad', ['version'], {silent: true})
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
(async () => {
  await runAction()
})().catch(error => {
  core.setFailed(error.message)
})
