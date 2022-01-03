// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require('path');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const DbuxRoot = path.resolve(__dirname, `..`);

const baseUrl = '/dbux/';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Dbux',
  tagline: 'Integrated Debugging Environment + Omniscient Debugger',
  url: 'https://domiii.github.io',
  baseUrl,

  projectName: 'dbux', // Usually your repo name.
  favicon: 'img/favicon.ico',

  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  /**
   * @see https://docusaurus.io/docs/next/markdown-features/assets
   */
  staticDirectories: [
    'public',
    'static',
    path.resolve(DbuxRoot, 'dbux-code/resources'),
    path.resolve(__dirname, 'dbux_img')
  ],

  plugins: [
    'plugin-image-zoom',
    [
      path.resolve(__dirname, './plugins/webpack-override-plugin'),
      {
        overrides: {
          resolve: {
            alias: {
              '@src': path.resolve(__dirname, './src'),
              '@comp': path.resolve(__dirname, './src/components')
            }
          }
        }
      }
    ]
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          path: 'content',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/Domiii/dbux/blob/master/docs',
          sidebarCollapsed: false
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        },
      }),
    ],
  ],

  /**
   * @see https://docusaurus.io/docs/api/themes/configuration
   */
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      hideableSidebar: true,
      colorMode: {
        defaultMode: 'dark',
      },
      // announcementBar: {
      // },

      /**
       * @see https://github.com/flexanalytics/plugin-image-zoom
       */
      zoomSelector: 'img.zoomable',

      navbar: {
        title: 'Dbux',
        logo: {
          alt: 'Dbux Logo',
          src: 'dbux_icon.png',
        },
        items: [
          // {
          //   type: 'doc',
          //   docId: 'intro',
          //   position: 'left',
          //   label: 'Tutorial',
          // },
          // { 
          //   to: '/blog', label: 'Blog', position: 'left'
          // },
          {
            href: 'https://github.com/domiii/dbux',
            label: 'GitHub',
            position: 'right'
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/dbux',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/QKgq9ZE',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/domiii/dbux',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Dbux.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

  /** ###########################################################################
   * deployment
   * @see https://docusaurus.io/docs/deployment#deploying-to-github-pages
   * ##########################################################################*/

  // organizationName: 'real-world-debugging', // Usually your GitHub org/user name.
  organizationName: 'Domiii', // Usually your GitHub org/user name.
  deploymentBranch: 'master'

};

module.exports = config;
