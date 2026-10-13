import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

/** Spike host — load spike_remote từ http://localhost:4001/remoteEntry.js (conventions/05). */
export default {
  entry: './src/index.jsx',
  output: { publicPath: '/' },
  resolve: { extensions: ['.jsx', '.js'] },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'spike_host',
      remotes: {
        spike_remote: 'spike_remote@http://localhost:4001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
