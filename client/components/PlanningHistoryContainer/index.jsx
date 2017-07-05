import React from 'react'
import PropTypes from 'prop-types'
import { PlanningHistoryList } from '../../components'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'

class PlanningHistoryComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { planningHistoryItems, users } = this.props
        return (
            <div>
                <PlanningHistoryList planningHistoryItems={planningHistoryItems} users={users} />
            </div>
        )
    }

    componentWillMount() {
        this.props.fetchPlanningHistory(this.props.currentPlanningId)
    }
}

PlanningHistoryComponent.propTypes = {
    planningHistoryItems: PropTypes.array,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    currentPlanningId: PropTypes.string,
    fetchPlanningHistory: PropTypes.func,
}

const mapStateToProps = (state) => ({
    planningHistoryItems: selectors.getPlanningHistory(state),
    users: selectors.getUsers(state),
})

const mapDispatchToProps = (dispatch) => ({
    fetchPlanningHistory: (currentPlanningId) => (
        dispatch(actions.planning.api.fetchPlanningHistory(currentPlanningId))
    ),
})

export const PlanningHistoryContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningHistoryComponent)
