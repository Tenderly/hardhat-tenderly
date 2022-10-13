# Release & Prerelease packages

## Prerelease

> Warning! Prereleases are very complicated! Using them requires a thorough understanding of all parts of npm publishes. Mistakes can lead to repository and publish states that are very hard to fix.\
> To fix that problem we use changeset and GitHub Actions.

A prerelease workflow might look something like this:

```bash
git checkout beta
git merge <your branch> // recomended to use develep branch
yarn changeset // adding changesets
yarn changeset version
git add .
git commit -m "Version packages"
git push
```

Let's go through what's happening here:

Inside `beta` branch Changesets is into prerelease mode, prerelease mode have a `pre.json` file in the `.changeset` directory which stores information about the state the prerelease is in. For the specific data stored in the `pre.json` file, see the type definition of `PreState` in [`@changesets/types`](https://github.com/changesets/changesets/tree/main/packages/types).

```
yarn changeset version
```

This command will version packages as you would normally expect but append `-beta.0`. An important note is that this will bump dependent packages that wouldn't be bumped in normal releases because prerelease versions are not satisfied by most semver ranges.(e.g. `^5.0.0` is not satisfied by `5.1.0-beta.0`)

> Warning! The difference in Changesets configuration between the `beta` & `master` branches is that the `beta` branch has a `pre.json` file in the `.changeset` directory which stores information about the state of the prerelease is in.\
> So it is essential to **not delete or make any manual modification** to the `pre.json` file so the release does not end in production by mistake.

## Release

Open PR with destination to `master` branch and run:

```bash
yarn changeset // adding changesets
yarn changeset version
git add .
git commit -m "Version packages"
git push
```
