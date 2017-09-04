import React from 'react'
import PropTypes from 'prop-types'

function MultiPlanningSelectionActions(props) {
    const {
        selectAll,
        deselectAll,
    } = props
    const count = props.selected.length

    const stopEvent = (callback) => 
        (event) => {
            event.preventDefault()
            callback()
        }

    return (
        <div>
            {count} selected item{count > 1 && 's'}&nbsp;

            <a href onClick={stopEvent(selectAll)}>select all</a>
            /
            <a href onClick={stopEvent(deselectAll)}>deselect</a>
        </div>
    );
}

MultiPlanningSelectionActions.propTypes = {
    selectAll: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired,
    selected: PropTypes.array.isRequired,
}

export default MultiPlanningSelectionActions;
