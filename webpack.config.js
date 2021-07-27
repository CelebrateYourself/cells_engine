const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// const nodeModulesPath = path.resolve(__dirname, 'node_modules');

const commonConfig = {
    entry: './test/js/main.js',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: './js/bundle.js',
    },
    resolve: {
        extensions: [ 'css', '.js' ]
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(jpg|jpeg|png|eot|ttf|otf|woff|woff2|svg)$/,
                loader: `file-loader`,
                options: {
                    name: '[md5:hash:hex:30].[ext]',
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './test/index.html',
            inject: 'body',
            filename: 'index.html',
            hash: false,
        }),
        new CopyPlugin([{
            from: './test/css',
            to: './css',
        }]),
    ],
    devServer: {
        contentBase: false,
        index: './test/index.html',
        historyApiFallback: true,
        open: false,
        host: '0.0.0.0',
    },
    devtool: 'source-map',
};

module.exports = () => {
    return [commonConfig];
};
