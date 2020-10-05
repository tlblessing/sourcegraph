// We want to polyfill first.
import '../../shared/polyfills'

import React from 'react'
import { render } from 'react-dom'
import { AfterInstallPage } from '../after-install-page/AfterInstallPage'

// TODO dark theme support
// Share logic with webapp
document.body.classList.add('theme-light')

render(<AfterInstallPage />, document.querySelector('#root'))
