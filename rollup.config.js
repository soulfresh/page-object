import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const globals = {
  '@testing-library/react': 'TestingLibrary'
};

export default [
  // browser-friendly UMD build
  // {
  //   input: 'src/PageObject.js',
  //   external: ['@testing-library/react'],
  //   output: {
  //     name: 'page-object',
  //     file: pkg.browser,
  //     format: 'umd',
  //   },
  //   plugins: [
  //     resolve({
  //       // pass custom options to the resolve plugin
  //       customResolveOptions: {
  //         moduleDirectory: 'node_modules'
  //       }
  //     }),
  //     commonjs(
  //       // { '@testing-library/react': ['act'] }
  //     ),
  //     babel({
  //       exclude: ['node_modules/**']
  //     })
  //   ]
  // },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/PageObject.js',
    external: ['@testing-library/react'],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'es',
      }
    ],
    plugins: [
      babel({
        exclude: ['node_modules/**']
      })
    ]
  }
];
