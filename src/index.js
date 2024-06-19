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
  version: core.getInput('version', {required: true}).replace(/^[vV]/, ''), // strip the 'v' prefix
  githubToken: core.getInput('github-token'),
}

// main action entrypoint
async function runAction() {
  let version

  if (input.version.toLowerCase() === 'latest') {
    core.debug('Requesting latest nomad version...')
    version = await getLatestVersion(input.githubToken)
    core.debug(`Latest version: ${version}`)
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

  /** @type {string|undefined} */
  let restoredFromCache = undefined

  try {
    restoredFromCache = await cache.restoreCache([pathToInstall], cacheKey)
  } catch (e) {
    core.warning(e)
  }

  if (restoredFromCache) { // cache HIT
    core.info(`👌 Nomad has been restored from cache`)
  } else { // cache MISS
    const distUrl = getDistUrl(process.platform, process.arch, version)
    const pathToUnpack = path.join(os.tmpdir(), `nomad.tmp`)

    core.debug(`Downloading nomad from ${distUrl} to ${pathToUnpack}`)

    const distPath = await tc.downloadTool(distUrl, pathToUnpack)
    await tc.extractZip(distPath, pathToInstall)

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
 * @throws {Error} binary file not found in $PATH or version check failed
 */
async function doCheck() {
  const binPath = await io.which('nomad', true)

  if (binPath === "") {
    throw new Error('nomad binary file not found in $PATH')
  }

  core.info(`Nomad installed: ${binPath}`)
  core.setOutput('nomad-bin', binPath)

  await exec.exec('nomad', ['version'], {silent: true})
}

/**
 * @param {string} githubAuthToken
 * @returns {Promise<string>}
 */
async function getLatestVersion(githubAuthToken) {
  /** @type {import('@actions/github')} */
  const octokit = github.getOctokit(githubAuthToken)

  // docs: https://octokit.github.io/rest.js/v18#repos-get-latest-release
  const latest = await octokit.rest.repos.getLatestRelease({
    owner: 'hashicorp',
    repo: 'nomad',
  })

  return latest.data.tag_name.replace(/^[vV]/, '') // strip the 'v' prefix
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
 * @throws {Error} Unsupported platform or architecture
 */
function getDistUrl(platform, arch, version) {
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

      throw new Error(`Unsupported linux architecture (${arch})`)
    }

    case 'darwin': {
      switch (arch) {
        case 'x64': // Amd64
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_darwin_amd64.zip`

        case 'arm64':
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_darwin_arm64.zip`
      }

      throw new Error(`Unsupported MacOS architecture (${arch})`)
    }

    case 'win32': {
      switch (arch) {
        case 'x32': // 386
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_windows_386.zip`

        case 'x64': // Amd64
          return `https://releases.hashicorp.com/nomad/${version}/nomad_${version}_windows_amd64.zip`
      }

      throw new Error(`Unsupported windows architecture (${arch})`)
    }
  }

  throw new Error(`Unsupported platform (${platform})`)
}

// run the action
(async () => {
  await runAction()
})().catch(error => {
  core.setFailed(error.message)
})
