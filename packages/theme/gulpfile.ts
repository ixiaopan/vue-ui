import gulpLess from 'gulp-less'
import autoPrefixer from 'gulp-autoprefixer'
import gulpCleanCss from 'gulp-clean-css'
import rename from 'gulp-rename'
import path from 'path'
import { series, src, dest, parallel } from 'gulp'

import { WXP_PKG } from '../../build/utils/constants'
import { uiDir } from '../../build/utils/paths'

// dist/wxp-ui/theme
const uiThemeDir = path.resolve(uiDir, 'theme')
const noElPrefixFile = /(index|base)/


function compile() {
  return src(path.resolve(__dirname, './src/*.less'))
  .pipe(gulpLess())
  .pipe(autoPrefixer())
  // .on('data', (data) => {
  //     let content = data.contents.toString()
  //     content = content.replaceAll('../fonts', `${WXP_PKG}/theme/fonts`)
  //     data.contents = Buffer.from(content)
  // })
  .pipe(gulpCleanCss())
  .pipe(
    rename((path) => {
      if (!noElPrefixFile.test(path.basename)) {
        path.basename = `m-${path.basename}`
      }
    })
  )
  .pipe(dest('./dist'))
}

// function copyFont() {
//   return src(path.resolve(__dirname, './src/fonts/**'))
//         .pipe(dest('./dist/fonts'))
// }

function copy2Theme() {
  return src(
      path.resolve(__dirname, './dist/**'))
      .pipe(dest(path.resolve(__dirname, uiThemeDir)))
}


function copyThemeSource() {
  return src(path.resolve(__dirname, 'src/**')).pipe(
    dest(path.resolve(uiThemeDir, 'src'))
  )
}

// - dist
//   - wxp-ui
//     - dist
//     - es
//     - lib
//     - theme
//       - index.css
//       - base.css
//       - m-button.css
//       - font
//         - icon.ttf
//       - src
//         - common
//         - font
//         - button.less
//         - index.less
//         - base.less

export default parallel(
  copyThemeSource,
  // series(compile, copyFont, copy2Theme)
  series(compile, copy2Theme)
)
