import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as actions from '../../actions'

function MultiPlanningSelectionActions(props) {
    const {
        selectAll,
        deselectAll,
        actions,
    } = props
    const count = props.selected.length

    const stopEvent = (callback) =>
        (event) => {
            event.preventDefault()
            callback()
        }

    const trigger = (action) =>
        (event) => {
            action.run()
        }

    const buttons = actions.map((action) => {
        const className = 'btn btn--' + (action.btn ? action.btn : 'primary')

        return (
            <button
                key={action.name}
                onClick={trigger(action)}
                className={className}
                >{action.name}
            </button>
        );
    })

    return (
        <div className="MultiSelectionActions">
            <div className="MultiSelectionActions__info">
                {count} selected item{count > 1 && 's'}&nbsp;
                <a href onClick={stopEvent(selectAll)}>select&nbsp;all</a>
                &nbsp;/&nbsp;
                <a href onClick={stopEvent(deselectAll)}>deselect</a>
            </div>

            <div className="MultiSelectionActions__actions">
                {buttons}
            </div>
        </div>
    )
}

MultiPlanningSelectionActions.propTypes = {
    actions: PropTypes.array.isRequired,
    selected: PropTypes.array.isRequired,
    selectAll: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired,
}

export default MultiPlanningSelectionActions
