<p align="center">
  <img src="https://hsto.org/webt/35/4-/o-/354-o-9pgi-abkq7d5mxu_-jxyc.png" alt="Logo" width="100" />
</p>

# Install [nomad][nomad] action

![Release version][badge_release_version]
[![Build Status][badge_build]][link_build]
[![License][badge_license]][link_license]

This action installs [nomad][nomad] as a binary file into your workflow.

## Usage

```yaml
jobs:
  install-nomad:
    runs-on: ubuntu-20.04
    steps:
      - uses: gacts/install-nomad@v1
        #with:
        #  version: 1.2.0 # `latest` by default, but you can set a specific version to install, e.g.: `1.2.0`

      - run: nomad version # any nomad command can be executed
```

## Customizing

### Inputs

Following inputs can be used as `step.with` keys:

| Name           |   Type   |        Default        | Required | Description                                                 |
|----------------|:--------:|:---------------------:|:--------:|-------------------------------------------------------------|
| `version`      | `string` |       `latest`        |   yes    | Nomad version to install                                    |
| `github-token` | `string` | `${{ github.token }}` |    no    | GitHub token (for requesting the latest Nomad version info) |

### Outputs

| Name        |   Type   | Description                   |
|-------------|:--------:|-------------------------------|
| `nomad-bin` | `string` | Path to the nomad binary file |

## Releasing

New versions releasing scenario:

- Make required changes in the [changelog](CHANGELOG.md) file
- Build the action distribution (`make build` or `yarn build`)
- Commit and push changes (including `dist` directory changes - this is important) into the `master` branch
- Publish new release using repo releases page (git tag should follow `vX.Y.Z` format)

Major and minor git tags (`v1` and `v1.2` if you publish `v1.2.Z` release) will be updated automatically.

## Support

[![Issues][badge_issues]][link_issues]
[![Issues][badge_pulls]][link_pulls]

If you find any action errors, please, [make an issue][link_create_issue] in the current repository.

## License

This is open-sourced software licensed under the [MIT License][link_license].

[badge_build]:https://img.shields.io/github/workflow/status/gacts/install-nomad/tests?maxAge=30
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
