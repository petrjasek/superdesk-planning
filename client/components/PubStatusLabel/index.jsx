import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger } from 'react-bootstrap'
import { EVENTS } from '../../constants'
import classNames from 'classnames'
import { get } from 'lodash'
import {
    pubStatusUsuableTooltip,
    pubStatusWithHoldTooltip,
} from '../Tooltips'

const PUB_STATUS_LABELS = {
    [EVENTS.PUB_STATUS.USABLE]: {
        label: 'P',
        labelVerbose: 'Published',
        labelType: 'success',
        tooltip: pubStatusUsuableTooltip,
    },
    [EVENTS.PUB_STATUS.WITHHOLD]: {
        label: 'Unpublished',
        labelType: 'warning',
        tooltip: pubStatusWithHoldTooltip,
    },
    internal: {
        label: 'Internal',
        labelType: 'default',
        tooltip: pubStatusWithHoldTooltip,
    },
}

const PubStatusLabel = ({ status, verbose }) => {
    const pubStatus = PUB_STATUS_LABELS[status]
    if (!pubStatus || (pubStatus === PUB_STATUS_LABELS.internal && !verbose)) {
        return null
    }

    const labelClasses = classNames('label', `label--${pubStatus.labelType}`)
    return (
        <OverlayTrigger placement="bottom" overlay={pubStatus.tooltip}>
            <span className={labelClasses}>
                {verbose ? get(pubStatus, 'labelVerbose', pubStatus.label) : pubStatus.label}
            </span>
        </OverlayTrigger>
    )
}

PubStatusLabel.defaultProps = {
    status: 'internal',
    verbose: false,
}

PubStatusLabel.propTypes = {
    status: PropTypes.string.isRequired,
    verbose: PropTypes.bool,
}

export default PubStatusLabel
