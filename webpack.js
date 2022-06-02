const path = require('path');

module.exports =
[
  {
    mode: "production",
    performance: { hints: false },
    entry: ['./src/js/main.js'
          ],
    output: {
      filename: '../js/main.app.js',
    },
    optimization: {
      minimize: false
    },
  },
];