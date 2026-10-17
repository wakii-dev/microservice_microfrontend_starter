import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

/** Spike remote — expose ./Hello. Port 4001 theo conventions/05 (remote dev port). */
export default {
  entry: './src/index.js',
  output: {
    // publicPath tuyệt đối — runtime chunk fetch về đúng origin remote
    publicPath: 'http://localhost:4001/',
  },
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
      name: 'spike_remote',
      filename: 'remoteEntry.js',
      exposes: { './Hello': './src/Hello.jsx' },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
