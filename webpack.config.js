const path = require('path');
module.exports = {
 "mode": "none",
 "entry": "./src/index.js",
 "output": {
   "path": __dirname + '/dist',
   "filename": "bundle.js"
 },
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
    static: [
      {
        directory: path.join(__dirname, 'dist'),
        serveIndex: true,
        watch: true,
      }
    ],
  },
 "module": {
   "rules": [
     {
       test: /\.bin/,
       type: 'asset/resource'
     },
     {
       "test": /\.css$/,
       "use": [
         "style-loader",
         "css-loader"
       ]
     },
   ]
 }
}
