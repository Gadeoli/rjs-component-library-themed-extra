const presets = [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-typescript",
];

const plugins = [
    ["babel-plugin-styled-components", {
        namespace: 'cl-themed',
        displayName: false,
        fileName: false
    }]
];

module.exports = { presets, plugins };