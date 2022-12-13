const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/js/setup.ts',
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'setup.mjs',
    path: path.resolve(__dirname, 'packed'),
    library: {
      type: 'module',
    },
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        //{ from: 'src/templates', to: 'templates' },
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'mod_logo_cl.png', to: 'mod_logo_cl.png' },
      ]
    })
  ],
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    generator: {
      'asset/resource': {
        publicPath: 'img/',
        outputPath: 'img/',
        filename: '[name][ext]',
      },
    },
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
  },
};