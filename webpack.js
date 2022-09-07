const path = require('path');

module.exports =
[
  {
    mode: "production",
    performance: { hints: false },
    entry: {
      main: './src/js/main.js',
      adminSection: './src/js/adminSection.js',
    },
    output: {
      filename: '../js/[name].app.js',
    },
    optimization: {
      minimize: false
    },
    module: {
      rules: [
          {
            test: /\.less$/,
            use: [
              {
                loader: 'style-loader',
              },
              {
                loader: 'css-loader',
              },
              {
                loader: 'less-loader',
              },
            ],
          },
          {
              test: /\.(css|scss)$/i,
              use: [
                  {
                    loader: 'style-loader',
                  },
                  {
                    loader: 'css-loader',
                  },
                  {
                    loader: 'postcss-loader',
                  },
                  {
                    loader: 'sass-loader',
                  },
              ],
            },
            {
              test: /\.(ttf|eot|svg|gif|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
              use: [{
                  loader: 'file-loader'
              }]
            },
        ],
    },
  },
];