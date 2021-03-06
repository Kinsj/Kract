const HtmlWebpackPlugin = require('html-webpack-plugin');
const base = require('./webpack.config');

// Object.assign 用于合并对象属性。此处把webpack.config.js内容合并
// 得到完整的 开发环境 webpack 配置
module.exports = Object.assign({}, base, {
    mode: 'development',
    entry: {
        main: './index.jsx'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'own-react',
            template: "index.html"
        })
    ],
});