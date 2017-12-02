import { createReducer } from '../utils'
import { RESET_STORE, INIT_STORE, LOCKS, PLANNING, EVENTS, ASSIGNMENTS } from '../constants'
import { cloneDeep, get } from 'lodash'

const initialLockState = {
    events: {},
    planning: {},
    recurring: {},
    assignments: {},
}

export const convertItemToLock = (item, itemType) => ({
    action: item.lock_action,
    session: item.lock_session,
    time: item.lock_time,
    user: item.lock_user,
    item_type: itemType,
    item_id: item._id,
})

const removeLock = (item, state, itemType) => {
    if (get(item, 'recurrence_id')) {
        delete state.recurring[item.recurrence_id]
    } else if (get(item, 'event_item')) {
        delete state.events[item.event_item]
    } else {
        delete state[itemType][item._id]
    }

    return state
}

const addLock = (item, state, itemType) => {
    const lock = convertItemToLock(item, itemType)

    if (get(item, 'recurrence_id')) {
        state.recurring[item.recurrence_id] = lock
    } else if (get(item, 'event_item')) {
        state.events[item.event_item] = lock
    } else {
        state[itemType][item._id] = lock
    }

    return state
}

export default createReducer(initialLockState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialLockState),

    [PLANNING.ACTIONS.UNLOCK_PLANNING]: (state, payload) =>
        removeLock(payload.plan, cloneDeep(state), 'planning'),

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) =>
        removeLock(payload.event, cloneDeep(state), 'events'),

    [EVENTS.ACTIONS.LOCK_EVENT]: (state, payload) => (
        addLock(payload.event, cloneDeep(state), 'events')
    ),

    [PLANNING.ACTIONS.LOCK_PLANNING]: (state, payload) => (
        addLock(payload.plan, cloneDeep(state), 'planning')
    ),

    [ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT]: (state, payload) => (
        addLock(payload.assignment, cloneDeep(state), 'assignments')
    ),

    [ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT]: (state, payload) => (
        removeLock(payload.assignment, cloneDeep(state), 'assignments')
    ),

    [LOCKS.ACTIONS.RECEIVE]: (state, payload) => {
        const locks = {
            events: {},
            planning: {},
            recurring: {},
            assignments: {},
        }

        if (payload.events) {
            payload.events.forEach((event) => addLock(event, locks, 'events'))
        }

        if (payload.plans) {
            payload.plans.forEach((plan) => addLock(plan, locks, 'planning'))
        }

        if (payload.assignments) {
            payload.assignments.forEach((assignment) => addLock(assignment, locks, 'assignments'))
        }

        return locks
    },

    [EVENTS.ACTIONS.MARK_EVENT_CANCELLED]: (state, payload) => (
        removeLock(payload.event, cloneDeep(state), 'events')
    ),

    [EVENTS.ACTIONS.MARK_EVENT_POSTPONED]: (state, payload) => (
        removeLock(payload.event, cloneDeep(state), 'events')
    ),

    [EVENTS.ACTIONS.SPIKE_EVENT]: (state, payload) => (
        removeLock(payload.event, cloneDeep(state), 'events')
    ),

    [EVENTS.ACTIONS.SPIKE_RECURRING_EVENTS]: (state, payload) => (
        // The recurrence_id is being sent by the notification
        // And the removeLock function checks for recurrence_id first
        // Therefor we can simply pass the payload to removeLock
        removeLock(payload, cloneDeep(state), 'events')
    ),

    [EVENTS.ACTIONS.UNSPIKE_EVENT]: (state, payload) => (
        removeLock(payload.event, cloneDeep(state), 'events')
    ),

    [PLANNING.ACTIONS.SPIKE_PLANNING]: (state, payload) => (
        removeLock(payload.plan, cloneDeep(state), 'planning')
    ),

    [PLANNING.ACTIONS.UNSPIKE_PLANNING]: (state, payload) => (
        removeLock(payload.plan, cloneDeep(state), 'planning')
    ),

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: (state, payload) => (
        removeLock({ _id: payload.planning }, cloneDeep(state), 'planning')
    ),
})
