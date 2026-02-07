# SOUL.PRISM [WIP]
_Currently a work-in-progress_

The client UI + Next.js backend for `prism`. This is what will be visible to the users. It handles the user data, and forwards the constructed user requests to the proxy. It's also reponsible for analytics.

## Setup
This project uses `bun` as the JS runtime as it's lightning fast and outclasses any other runtime. If you don't have bun, please install it from [here](https://bun.sh/)

Run `bun install` after cloning the git repo to automatically install neccessary packages.

- For development, run `make dev`
- To build, run `make build` - the build will be in the default `.next` directory 

To know more about these commands, look into the `Makefile`

## Tests
To run tests, run `make test`
- Browser APIs that need to be mocked can be defined in `jest.setup.js`
- For info on how to write tests, check out the [Jest docs](https://jestjs.io/docs/getting-started)

## Docs
For generating docs, run `make docs`
- Docs will be generated to public/docs
- Visit /docs/index.html to view the docs
- For info on how to write comments for docs, check out the [TypeDoc docs](https://typedoc.org/)