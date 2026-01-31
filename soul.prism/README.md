# VIEW

The client UI + minimal Next.js backend for `prism`. This is what will be visible to the users.

## Requirements
Run bun install after cloning the git repo to automatically install neccessary packages

## Setup
This project uses `bun` as the package manager as it's lightning fast and outclasses npm. If you don't have bun, please install it from [here](https://bun.sh/)

- For development, run `make dev`
- To build, run `make build` - the build will be in the default `.next` directory 

To know more about these commands, look into the `Makefile`

## Contributing
For any new feature, checkout a new git branch, add your changes there, and create a PR to merge it into main. NEVER PUSH DIRECTLY TO MAIN. 

Follow [Git hygiene](https://cbea.ms/git-commit/), and [Commit Convetions](https://medium.com/@aslandjc7/git-is-a-powerful-version-control-system-but-writing-clear-and-meaningful-commit-messages-is-48eebc428a00)