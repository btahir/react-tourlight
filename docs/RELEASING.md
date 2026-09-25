# Local npm release

This PR prepares `react-tourlight@0.5.0` and `react-tourlight-mcp@0.1.1`.
The docs workspace is private. Versions and changelogs are already applied;
do not run another version bump for this release. Nothing is published by merging.

The root `README.md` is also the npm README. npm displays the copy shipped with
the published package; a GitHub commit alone does not update npm. The MCP package
has its own README. Both include voluntary sponsorship links.

## After merging

From a clean, up-to-date `main` checkout, using Node.js 24 and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm test:tools
pnpm --filter react-tourlight-docs build
npm view react-tourlight version
```

Check that the prepared versions have not already been published. Preview the
package contents without uploading:

```sh
pnpm publish --dry-run --access public
pnpm --filter react-tourlight-mcp publish --dry-run --access public
```

When ready, authenticate to the intended npm account and publish the library
first, then the optional MCP package that depends on it:

```sh
pnpm publish --access public --tag latest
pnpm --filter react-tourlight-mcp publish --access public --tag latest
```

Complete any npm authentication/OTP prompts locally. Verify the registry:

```sh
npm view react-tourlight version dist-tags funding
npm view react-tourlight-mcp version dependencies.react-tourlight funding
```

Expected versions are `0.5.0` and `0.1.1`. The MCP tarball must reference
`react-tourlight` version `0.5.0`, not the development-only `workspace:*` protocol;
pnpm performs that rewrite when packing/publishing. Use pnpm for MCP publishing.

The website deploy is separate. Deploy the merged docs site so `/support` and the
new documentation resolve from npm funding links. To upgrade a consuming app
after publishing, run `npm install react-tourlight@latest @floating-ui/react-dom`
in that app and verify its guides.

Future releases can use `pnpm changeset`, then `pnpm exec changeset version` and
commit the generated version/changelog updates before this publishing process.
