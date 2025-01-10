const path = require('path');

module.exports = {
    context: __dirname,
    entry: {
        main: './src/main.ts',
        worker: './src/Stippling/stippleWorker.worker.ts'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    mode: "development",

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.wgsl$/,
                use: 'ts-shader-loader'
            },
            // {
            //     test: /\.worker\.ts$/,
            //     use: {
            //         loader: 'worker-loader',
            //         options: { inline: 'no-fallback' }
            //     }
            // },
            // {
            //     test: /\.worker\.ts$/, // Match your worker files
            //     use: {
            //         loader: 'worker-loader',
            //         options: {
            //             inline: 'no-fallback', // Ensures the worker is loaded as a separate file
            //         },
            //     },
            // },
        ]
    },

    resolve: {
        extensions: ['.ts', '.js']
    }
}