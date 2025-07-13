/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    // "@storybook/addon-links",
    // "@storybook/addon-interactions",
    "@storybook/preset-scss"

    /*
    //Others
    //Removed addons for no use
    //Add they back if needed again
    "@storybook/addon-actions": "^8.5.3",
    "@storybook/addon-interactions": "^8.5.3",
    "@storybook/addon-links": "^8.5.3",
    */
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (config, { configType }) => {
    // console.log(configType);

    if (configType === 'PRODUCTION') {
      // Disable polyfills for unnecessary browsers (e.g., if you only target modern browsers)
      config.resolve = {
        ...config.resolve,
        fallback: {
          fs: false,
          path: false,
          os: false,
          // other fallbacks
        },
      };

      // Enable minification for production builds
      config.optimization.minimize = true;
      config.devtool = false;
      config.stats = 'minimal';
      
      //Config chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 200000,  // Split large chunks to improve caching
      };
    }else{
      //Config chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 100000, // limit individual chunks to 100 KB
      };

      //Active analyzer
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',  // Keep the server mode to open the analyzer in the browser
          openAnalyzer: false,     // Open it in port 8888
        })
      );
    }

    return config;
  },
};

export default config;