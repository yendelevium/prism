# VIEW

The client UI + minimal Next.js backend for `prism`. This is what will be visible to the users.

## Requirements
Run bun install after cloning the git repo to automatically install neccessary packages

## Setup
This project uses `bun` as the package manager as it's lightning fast and outclasses npm. If you don't have bun, please install it from [here](https://bun.sh/)

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

## Contributing
For any new feature, checkout a new git branch, add your changes there, and create a PR to merge it into main. NEVER PUSH DIRECTLY TO MAIN. 

Follow [Git hygiene](https://cbea.ms/git-commit/), and [Commit Convetions](https://medium.com/@aslandjc7/git-is-a-powerful-version-control-system-but-writing-clear-and-meaningful-commit-messages-is-48eebc428a00)