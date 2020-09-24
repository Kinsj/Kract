const config = {
  mode: 'development',
  entry: {
    main: './index.jsx'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader'
      },
    ]
  }
};

module.exports = config;