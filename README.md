<p align="center">
  <img src="https://hsto.org/webt/35/4-/o-/354-o-9pgi-abkq7d5mxu_-jxyc.png" alt="Logo" width="100" />
</p>

# Install [nomad][nomad] Action

![Release version][badge_release_version]
[![Build Status][badge_build]][link_build]
[![License][badge_license]][link_license]

This action installs [nomad][nomad] as a binary file into your workflow. It can be run on **Linux** (`ubuntu-latest`),
**macOS** (`macos-latest`), or **Windows** (`windows-latest`).

- 💾 Nomad downloads page: <https://www.nomadproject.io/downloads>
- 🚀 Nomad releases page: <https://github.com/hashicorp/nomad/releases>

Additionally, this action uses the GitHub **caching mechanism** to speed up your workflow execution time!

## Usage

```yaml
jobs:
  install-nomad:
    runs-on: ubuntu-latest
    steps:
      - uses: gacts/install-nomad@v1
        #with:
        #  version: 1.2.0 # `latest` by default, but you can set a specific version to install

      - run: nomad version # any nomad command can be executed
```

## Customizing

### Inputs

The following inputs can be used as `step.with` keys:

| Name           |   Type   |        Default        | Required | Description                                                 |
|----------------|:--------:|:---------------------:|:--------:|-------------------------------------------------------------|
| `version`      | `string` |       `latest`        |    no    | Nomad version to install                                    |
| `github-token` | `string` | `${{ github.token }}` |    no    | GitHub token (for requesting the latest Nomad version info) |

### Outputs

| Name        |   Type   | Description                   |
|-------------|:--------:|-------------------------------|
| `nomad-bin` | `string` | Path to the nomad binary file |

## Releasing

To release a new version:

- Build the action distribution (`make build` or `npm run build`).
- Commit and push changes (including `dist` directory changes - this is important) to the `master` branch.
- Publish the new release using the repo releases page (the git tag should follow the `vX.Y.Z` format).

Major and minor git tags (`v1` and `v1.2` if you publish a `v1.2.Z` release) will be updated automatically.

## Support

[![Issues][badge_issues]][link_issues]
[![Pull Requests][badge_pulls]][link_pulls]

If you find any action errors, please, [make an issue][link_create_issue] in the current repository.

## License

This is open-source software licensed under the [MIT License][link_license].

[badge_build]:https://img.shields.io/github/actions/workflow/status/gacts/install-nomad/tests.yml?branch=main&maxAge=30
[badge_release_version]:https://img.shields.io/github/release/gacts/install-nomad.svg?maxAge=30
[badge_license]:https://img.shields.io/github/license/gacts/install-nomad.svg?longCache=true
[badge_release_date]:https://img.shields.io/github/release-date/gacts/install-nomad.svg?maxAge=180
[badge_commits_since_release]:https://img.shields.io/github/commits-since/gacts/install-nomad/latest.svg?maxAge=45
[badge_issues]:https://img.shields.io/github/issues/gacts/install-nomad.svg?maxAge=45
[badge_pulls]:https://img.shields.io/github/issues-pr/gacts/install-nomad.svg?maxAge=45

[link_build]:https://github.com/gacts/install-nomad/actions
[link_license]:https://github.com/gacts/install-nomad/blob/master/LICENSE
[link_issues]:https://github.com/gacts/install-nomad/issues
[link_create_issue]:https://github.com/gacts/install-nomad/issues/new
[link_pulls]:https://github.com/gacts/install-nomad/pulls

[nomad]:https://github.com/hashicorp/nomad
