const path = require('path');
const webpack = require('webpack');

module.exports =
  [
    {
      mode: "production",
      performance: { hints: false },
      entry: {
        main: './src/js/index/main.js',
        adminSection: './src/js/admin/adminSection.js'
      },
      output: {
        filename: '../js/[name].app.js',
      },
      optimization: {
        minimize: false
      },
      resolve: {
        fallback: {
            "http": false,
            "https": false,
            "stream": false,
            process: require.resolve('process/browser')
        },
        alias: {
          "icons": path.resolve(__dirname, "node_modules/vue-material-design-icons")
        },
        extensions: ['.vue', '.js', '.json'] // Assurez-vous d'inclure les extensions existantes
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
      resolve: {
        fallback: {
          path: require.resolve('path-browserify')
        }
      }
    },
  ];
