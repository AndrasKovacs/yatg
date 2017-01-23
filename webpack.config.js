module.exports = {
   entry: './main.jsx',
	
   output: {
      path:'./',
      filename: 'index.js',
   },
	
   devServer: {
      inline: true,
      port: 8080
   },

   devtool: 'cheap-module-eval-source-map',
	
   module: {
      loaders: [
         {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel'
         }
      ]
   }
}
