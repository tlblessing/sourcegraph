import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { OptionsPage } from './OptionsPage'
import optionsStyles from '../../options.scss'

storiesOf('browser/Options/OptionsPage', module)
    .addDecorator(story => (
        <>
            <style>{optionsStyles}</style>
            <div>{story()}</div>
        </>
    ))
    .add('Default', () => <OptionsPage version="0.0.0" />)
