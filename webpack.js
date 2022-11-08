const path = require('path');

module.exports =
  [
    {
      mode: "production",
      performance: { hints: false },
      entry: {
        main: './src/js/index/main.js',
        adminSection: './src/js/admin/adminSection.js',
        hr: './src/js/index/hr.js'
      },
      output: {
        filename: '../js/[name].app.js',
      },
      optimization: {
        minimize: true
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