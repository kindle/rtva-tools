# rtva-tools-extension

This project is a Visual Studio Code extension that provides a custom task provider. It allows users to define and execute tasks directly within the editor, example: run ci-build.sh to build RTVA VAA projects.

## Features
1. Set task name via "label": "Debug VAE0",
2. Set task icon via "icon":"debug-console",
3. Set task command via "command": "/data/VAH/.vscode/debug_vae0.sh",
4. Set if convert linux to html via "asci": true,
5. Set if ask user to confirm via "confirm": true,

## Usage examples

1. compile > npm run compile
2. package > vsce package 1.0.15
3. publish > vsce publish 1.0.15
4. login > vsce login bailin

## License

This project is licensed under the MIT License. See the LICENSE file for details.