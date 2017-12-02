import { showModal, hideModal } from '../index'
import planning from './index'
import { locks } from '../index'
import { checkPermission, getErrorMessage, isItemLockedInThisSession, planningUtils } from '../../utils'
import * as selectors from '../../selectors'
import { PLANNING, PRIVILEGES, SPIKED_STATE, WORKSPACE, MODALS, ASSIGNMENTS } from '../../constants'
import * as actions from '../index'
import { get, orderBy } from 'lodash'
import { change } from 'redux-form'
import moment from 'moment'
import { stripHtmlRaw } from 'superdesk-core/scripts/apps/authoring/authoring/helpers'

/**
 * Action dispatcher that marks a Planning item as spiked
 * @param {object} item - The planning item to spike
 * @return Promise
 */
const _spike = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.spike(item))
        .then(() => {
            notify.success('The Planning Item has been spiked.')
            if (selectors.getCurrentPlanningId(getState()) === item._id) {
                dispatch(self.closeEditor())
            }

            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'There was a problem, Planning item not spiked!')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Action dispatcher that marks a Planning item as active
 * @param {object} item - The Planning item to unspike
 * @return Promise
 */
const _unspike = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unspike(item))
        .then(() => {
            notify.success('The Planning Item has been unspiked.')
            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'There was a problem, Planning item not unspiked!')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Saves a Planning Item
 * If the item does not contain an _id, then it creates a new planning item instead
 * @param {object} item - The Planning item to save
 * @return Promise
 */
const save = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.save(item))
        .then((item) => {
            notify.success('The planning item has been saved.')
            return dispatch(self.refetch())
            .then(() => Promise.resolve(item))
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to save the Planning item!')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Saves the supplied planning item and reload the
 * list of Agendas and their associated planning items.
 * If the planning item does not have an ._id, then add it to the
 * currently selected Agenda
 * If no Agenda is selected, or the currently selected Agenda is spiked,
 * then notify the end user and reject this action
 * @param {object} item - The planning item to save
 * @return Promise
 */
const saveAndReloadCurrentAgenda = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.saveAndReloadCurrentAgenda(item))
        .then((item) => {
            notify.success('The Planning item has been saved.')
            return dispatch(self.refetch())
            .then(() => (dispatch(planning.api.fetchPlanningById(item._id, true))))
            .then((item) => (Promise.resolve(item)))
        }, (error) => {
            notify.error(getErrorMessage(error, 'Failed to save the Planning item!'))
            return Promise.reject(error)
        })
    )
)

/**
 * Opens the Planning in read-only mode
 * @param {object} item - The planning item to open
 * @return Promise
 */
const preview = (item) => (
    (dispatch) => {
        dispatch({
            type: PLANNING.ACTIONS.PREVIEW_PLANNING,
            payload: item,
        })
        return Promise.resolve(item)
    }
)

/**
 * Unlock a Planning item and open it for editing
 * @param {object} item - The Planning item to unlock and edit
 * @return Promise
 */
const _unlockAndOpenEditor = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(locks.unlock(item))
        .then((unlockedItem) => {
            // Was related event unlocked ?
            if (unlockedItem.type === 'event') {
                dispatch(self.openEditor(item))
            } else {
                dispatch(self.openEditor(unlockedItem))
            }

            return Promise.resolve(unlockedItem)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not unlock the planning item.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Unlock a Planning item and close editor if opened - used when item closed from workqueue
 * @param {object} item - The Planning item to unlock
 * @return Promise
 */
const unlockAndCloseEditor = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unlock(item))
        .then(() => {
            if (selectors.getCurrentPlanningId(getState()) === item._id) {
                dispatch({ type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR })
            }

            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not unlock the planning item.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Lock and open a Planning item for editing
 * @param {object} item - The Planning item to lock and edit
 * @return Promise
 */
const _lockAndOpenEditor = (item, checkWorkspace=true) => (
    (dispatch, getState, { notify }) => {
        const currentWorkspace = selectors.getCurrentWorkspace(getState())
        if (checkWorkspace && currentWorkspace !== WORKSPACE.PLANNING) {
            dispatch(self.preview(item))
            return Promise.resolve(item)
        }

        // If the user already has a lock, don't obtain a new lock, open it directly
        if (item && isItemLockedInThisSession(item,
                selectors.getSessionDetails(getState()))) {
            dispatch(self._openEditor(item))
            return Promise.resolve(item)
        }

        return dispatch(planning.api.lock(item))
        .then((lockedItem) => {
            dispatch(self._openEditor(lockedItem))
            return Promise.resolve(lockedItem)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not obtain lock on the planning item.')
            )
            dispatch(self._openEditor(item))
            return Promise.reject(error)
        })
    }
)

/**
 * Action for closing the planning editor
 * @return Promise
 */
const closeEditor = (item) => (
    (dispatch, getState, { notify }) => {
        dispatch({ type: PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR })

        if (!item) return Promise.resolve()

        if (isItemLockedInThisSession(item, selectors.getSessionDetails(getState()))) {
            return dispatch(planning.api.unlock(item))
            .then(() => Promise.resolve(item))
            .catch(() => {
                notify.error('Could not unlock the planning item.')
                return Promise.resolve(item)
            })
        } else {
            return Promise.resolve(item)
        }
    }
)

/**
 * Action for opening the planning editor
 *
 */
const _openEditor = (item) => ({
    type: PLANNING.ACTIONS.OPEN_PLANNING_EDITOR,
    payload: item,
})

/**
 * Previews the Planning Editor
 * Also selects the associated agenda of this planning item
 * @param {string} pid - The Planning item id to preview
 * @return Promise
 */
const previewPlanningAndOpenAgenda = (pid, agenda) => (
    (dispatch, getState) => {

        if (agenda && agenda._id !== selectors.getCurrentAgendaId(getState())) {
            dispatch(actions.selectAgenda(agenda._id))
        }

        // open the planning details
        return dispatch(self.preview(pid))
    }
)

/**
 * Opens the Planning Editor
 * Also selects the associated agenda of this planning item
 * @param {Object} planning - The Planning item to open
 * @param {string} agendaId - The agendaId to set associated agenda as selected
 * @return Promise
 */
const openPlanningWithAgenda = (planning, agendaId) => (
    (dispatch, getState) => {

        if (agendaId && agendaId !== selectors.getCurrentAgendaId(getState())) {
            dispatch(actions.selectAgenda(agendaId))
        }

        // open the planning details
        return dispatch(self._openEditor(planning))
    }
)

/**
 * Action dispatcher to toggle the `future` toggle of the planning list
 * @return Promise
 */
const toggleOnlyFutureFilter = () => (
    (dispatch, getState) => {
        dispatch({
            type: PLANNING.ACTIONS.SET_ONLY_FUTURE,
            payload: !getState().planning.onlyFuture,
        })

        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

/**
 * Action dispatcher to set the planning item filter keyword
 * This is used by the PlanningPanelContainer through the selector
 * to filter the list of planning items to display
 * @param {string} value - The filter string used to filter planning items
 */
const filterByKeyword = (value) => (
    (dispatch) => {
        dispatch({
            type: PLANNING.ACTIONS.PLANNING_FILTER_BY_KEYWORD,
            payload: value && value.trim() || null,
        })
        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

/**
 * Clears the Planning List
 */
const clearList = () => ({ type: PLANNING.ACTIONS.CLEAR_LIST })

/**
 * Action that sets the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 */
const setInList = (ids) => ({
    type: PLANNING.ACTIONS.SET_LIST,
    payload: ids,
})

/**
 * Action that adds Planning items to the list of visible Planning items
 * @param {Array} ids - An array of Planning item ids
 */
const addToList = (ids) => ({
    type: PLANNING.ACTIONS.ADD_TO_LIST,
    payload: ids,
})

/**
 * Queries the API and sets the Planning List to the items received
 * @param {object} params - Parameters used when querying for planning items
 */
const fetchToList = (params) => (
    (dispatch) => {
        dispatch(self.requestPlannings(params))
        return dispatch(planning.api.fetch(params))
        .then((items) => (dispatch(self.setInList(
            items.map((p) => p._id)
        ))))
    }
)

/**
 * Fetch more planning items and add them to the list
 * Uses planning.lastRequestParams from the redux store for the api query,
 * then adds the received Planning items to the Planning List
 */
const fetchMoreToList = () => (
    (dispatch, getState) => {
        const previousParams = selectors.getPreviousPlanningRequestParams(getState())
        const params = {
            ...previousParams,
            page: get(previousParams, 'page', 0) + 1,
        }
        dispatch(self.requestPlannings(params))
        return dispatch(planning.api.fetch(params))
        .then((items) => (dispatch(self.addToList(
            items.map((p) => p._id)
        ))))
    }
)

/**
 * Refetch planning items based on the current search
 */
const refetch = () => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.refetch())
        .then(
            (items) => {
                dispatch(planning.ui.setInList(items.map((p) => p._id)))
                return Promise.resolve(items)
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to update the planning list!')
                )
                return Promise.reject(error)
            }
        )
    )
)

const duplicate = (plan) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.duplicate(plan))
        .then((newPlan) => {
            dispatch(self.refetch())
            .then(() => {
                dispatch(self.closeEditor(plan))
                notify.success('Planning duplicated')
                return dispatch(self.openEditor(newPlan))
            }, (error) => (
                notify.error(
                    getErrorMessage(error, 'Failed to fetch Planning items')
                )
            ))
        }, (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to duplicate the Planning')
            )
        ))
    )
)

const cancelPlanning = (plan) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.cancel(plan))
        .then((plan) => {
            dispatch(hideModal())
            notify.success('Planning Item has been cancelled')

            return Promise.resolve(plan)
        }, (error) => {
            dispatch(hideModal())

            notify.error(
                getErrorMessage(error, 'Failed to cancel the Planning Item!')
            )

            return Promise.reject(error)
        })
    )
)

const cancelAllCoverage = (plan) => (
    (dispatch, getState, { notify }) => {
        // delete _cancelAllCoverage used for UI purposes
        delete plan._cancelAllCoverage

        return dispatch(planning.api.cancelAllCoverage(plan))
        .then((plan) => {
            dispatch(hideModal())
            notify.success('All Coverage has been cancelled')

            return Promise.resolve(plan)
        }, (error) => {
            dispatch(hideModal())

            notify.error(
                getErrorMessage(error, 'Failed to cancel all coverage!')
            )

            return Promise.reject(error)
        })
    }
)

const openCancelPlanningModal = (plan, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label,
        'planning_cancel',
        publish
    ))
)

const openCancelAllCoverageModal = (plan, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        plan,
        PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label,
        'cancel_all_coverage',
        publish
    ))
)

const _openActionModal = (plan,
    action,
    lockAction=null,
    publish=false,
    large=false
) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.lock(plan, lockAction))
        .then((lockedPlanning) => {
                lockedPlanning._publish = publish
                return dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        planning: lockedPlanning,
                        actionType: action,
                        large,
                    },
                }))
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to obtain the lock on Planning Item')
                )

                return Promise.reject(error)
            }
        )
    )
)

/**
 * Publish an item and notify user of success or failure
 * @param {object} item - The planning item
 */
const publish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.publish(item))
        .then(() => (
            notify.success('Planning item published!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to publish Planning item!')
            )
        ))
    )
)

/**
 * Unpublish an item and notify user of success or failure
 * @param {object} item - The planning item
 */
const unpublish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.unpublish(item))
        .then(() => (
            notify.success('Planning item unpublished!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to unpublish Planning item!')
            )
        ))
    )
)

/**
 * Save Planning item then Publish it
 * @param {object} item - Planning item
 */
const saveAndPublish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.saveAndPublish(item))
        .then(() => (
            notify.success('Planning item published!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to save Planning item!')
            )
        ))
    )
)

/**
 * Save Planning item then Unpublish it
 * @param item
 * @private
 */
const saveAndUnpublish = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.saveAndUnpublish(item))
        .then(() => (
            notify.success('Planning item unpublished!')
        ), (error) => (
            notify.error(
                getErrorMessage(error, 'Failed to save Planning item!')
            )
        ))
    )
)

/**
 * Close advanced search panel
 */
const closeAdvancedSearch = () => ({ type: PLANNING.ACTIONS.CLOSE_ADVANCED_SEARCH })

/**
 * Open advanced search panel
 */
const openAdvancedSearch = () => ({ type: PLANNING.ACTIONS.OPEN_ADVANCED_SEARCH })

/**
 * Set the advanced search params
 * @param {object} params - Advanced search params
 */
const search = (params={ spikeState: SPIKED_STATE.NOT_SPIKED }) => (
    (dispatch) => {
        dispatch(self._setAdvancedSearch(params))
        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

/**
 * Set the advanced search params
 * @param {object} params - Advanced search params
 */
const resetSearch = () => (
    (dispatch) => {
        dispatch(self._resetAdvancedSearch())
        return dispatch(actions.fetchSelectedAgendaPlannings())
    }
)

const _setAdvancedSearch = (params={}) => ({
    type: PLANNING.ACTIONS.SET_ADVANCED_SEARCH,
    payload: params,
})

const _resetAdvancedSearch = () => ({ type: PLANNING.ACTIONS.CLEAR_ADVANCED_SEARCH })

/**
 * Action that states that there are Planning items currently loading
 * @param {object} params - Parameters used when querying for planning items
 */
const requestPlannings = (params={}) => ({
    type: PLANNING.ACTIONS.REQUEST_PLANNINGS,
    payload: params,
})

const spike = checkPermission(
    _spike,
    PRIVILEGES.SPIKE_PLANNING,
    'Unauthorised to spike a planning item!'
)

const unspike = checkPermission(
    _unspike,
    PRIVILEGES.UNSPIKE_PLANNING,
    'Unauthorised to unspike a planning item!'
)

const openEditor = checkPermission(
    _lockAndOpenEditor,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to edit a planning item!',
    preview
)

const unlockAndOpenEditor = checkPermission(
    _unlockAndOpenEditor,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to ed a planning item!'
)

/**
 * Toggle selected status for given item id
 *
 * @param {String} itemId
 */
function toggleItemSelected(itemId) {
    return {
        type: PLANNING.ACTIONS.TOGGLE_SELECTED,
        payload: itemId,
    }
}

/**
 * Select all visible items
 */
function selectAll() {
    return { type: PLANNING.ACTIONS.SELECT_ALL }
}

/** * Deselect all selected items
 */
function deselectAll() {
    return { type: PLANNING.ACTIONS.DESELECT_ALL }
}

const onAddCoverageClick = (plan=undefined) => (
    (dispatch, getState, { notify }) => {
        const modalType = selectors.getCurrentModalType(getState())
        if (modalType !== MODALS.ADD_TO_PLANNING)
            return Promise.resolve()

        const modalProps = selectors.getCurrentModalProps(getState())
        if (!get(modalProps, 'newsItem')) {
            notify.error('No content item provided.')
            return Promise.reject('No content item provided.')
        }

        const newsItem = modalProps.newsItem
        const currentPlanning = selectors.getCurrentPlanning(getState())

        // Unlock the currentPlanning if it exists
        if (!plan) {
            plan = currentPlanning
        } else if (currentPlanning) {
            dispatch(planning.api.unlock(currentPlanning))
        }

        return dispatch(self.openEditor(plan, false))
        .then((lockedItem) => {
            const coverageIndex = get(lockedItem, 'coverages.length', 0)
            const coverage = self.createCoverageFromNewsItem(newsItem, getState)
            dispatch(change('planning', `coverages[${coverageIndex}]`, coverage))
            return Promise.resolve(lockedItem)
        })
    }
)

const onAddPlanningClick = () => (
    (dispatch, getState, { notify }) => {
        const modalType = selectors.getCurrentModalType(getState())
        if (modalType !== MODALS.ADD_TO_PLANNING)
            return Promise.resolve()

        const modalProps = selectors.getCurrentModalProps(getState())
        if (!get(modalProps, 'newsItem')) {
            notify.error('No content item provided.')
            return Promise.reject('No content item provided.')
        }

        const { newsItem } = modalProps

        // Unlock the currentPlanning if it exists
        const currentPlanning = selectors.getCurrentPlanning(getState())
        if (currentPlanning) {
            dispatch(planning.api.unlock(currentPlanning))
        }

        const coverage = self.createCoverageFromNewsItem(newsItem, getState)
        const newPlanning = {
            slugline: newsItem.slugline,
            ednote: get(newsItem, 'ednote'),
            subject: get(newsItem, 'subject'),
            anpa_category: get(newsItem, 'anpa_category'),
            urgency: get(newsItem, 'urgency'),
            description_text: stripHtmlRaw(
                get(newsItem, 'abstract', get(newsItem, 'headline', ''))
            ),
            coverages: [coverage],
        }

        if (get(newsItem, 'flags.marked_for_not_publication')) {
            newPlanning.flags = { marked_for_not_publication: true }
        }

        return dispatch(self._openEditor(newPlanning))
    }
)

const createCoverageFromNewsItem = (newsItem, getState) => {
    const contentTypes = selectors.getContentTypes(getState())
    const contentType = contentTypes.find(
        (ctype) => get(ctype, 'content item type') === newsItem.type
    )
    const coverage = {
        planning: {
            g2_content_type: get(contentType, 'qcode', 'text'),
            slugline: get(newsItem, 'slugline', ''),
            ednote: get(newsItem, 'ednote', ''),
        },
        news_coverage_status: { qcode: 'ncostat:int' },
    }

    if (get(newsItem, 'genre')) {
        coverage.planning.genre = newsItem.genre
        planningUtils.convertGenreToObject(coverage)
    }

    if (get(newsItem, 'state') === 'published') {
        coverage.planning.scheduled = newsItem._updated
        coverage.assigned_to = {
            desk: newsItem.task.desk,
            user: newsItem.task.user,
        }
    } else {
        coverage.planning.scheduled = moment().endOf('day')
        coverage.assigned_to = {
            desk: selectors.getCurrentDeskId(getState()),
            user: selectors.getCurrentUserId(getState()),
        }
    }

    coverage.assigned_to.priority = ASSIGNMENTS.DEFAULT_PRIORITY
    return coverage
}

const saveFromPlanning = (plan, { save=true, publish=false, unpublish=false }) => (
    (dispatch) => {
        if (save) {
            if (publish) {
                return dispatch(self.saveAndPublish(plan))
            } else if (unpublish) {
                return dispatch(self.saveAndUnpublish(plan))
            } else {
                return dispatch(self.saveAndReloadCurrentAgenda(plan))
            }
        } else {
            if (publish) {
                return dispatch(self.publish(plan))
            } else if (unpublish) {
                return dispatch(self.unpublish(plan))
            }
        }
    }
)

const saveFromAuthoring = (plan, publish=false) => (
    (dispatch, getState, { notify }) => {
        const { $scope, newsItem } = selectors.getCurrentModalProps(getState())
        const action = publish ?
            planning.api.saveAndPublish(plan) :
            planning.api.save(plan)

        dispatch(actions.actionInProgress(true))
        return dispatch(action)
        .then((newPlan) => {
            const coverages = orderBy(newPlan.coverages, ['firstcreated'], ['desc'])
            const coverage = coverages[0]
            return dispatch(actions.assignments.api.link(coverage.assigned_to, newsItem))
            .then(() => {
                notify.success('Content linked to the planning item.')
                $scope.resolve()
                dispatch(actions.actionInProgress(false))
                return Promise.resolve(newPlan)
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to link to the Planning item!')
                )
                $scope.reject()
                dispatch(actions.actionInProgress(false))
                return Promise.reject(error)
            })
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to save the Planning item!')
            )
            $scope.reject()
            dispatch(actions.actionInProgress(false))
            return Promise.reject(error)
        })
    }
)

const onPlanningFormSave = (plan, { save=true, publish=false, unpublish=false }) => (
    (dispatch, getState) => {
        const modalType = selectors.getCurrentModalType(getState())
        const currentWorkspace = selectors.getCurrentWorkspace(getState())
        if (modalType === MODALS.ADD_TO_PLANNING) {
            return dispatch(self.saveFromAuthoring(plan, publish))
        } else if (currentWorkspace === WORKSPACE.PLANNING) {
            return dispatch(self.saveFromPlanning(plan, {
                save,
                publish,
                unpublish,
            }))
        }
    }
)

const self = {
    spike,
    unspike,
    save,
    saveAndReloadCurrentAgenda,
    preview,
    _openActionModal,
    openEditor,
    _openEditor,
    closeEditor,
    previewPlanningAndOpenAgenda,
    openPlanningWithAgenda,
    toggleOnlyFutureFilter,
    filterByKeyword,
    unlockAndOpenEditor,
    unlockAndCloseEditor,
    clearList,
    fetchToList,
    requestPlannings,
    setInList,
    addToList,
    fetchMoreToList,
    publish,
    unpublish,
    saveAndPublish,
    saveAndUnpublish,
    refetch,
    duplicate,
    closeAdvancedSearch,
    openAdvancedSearch,
    _setAdvancedSearch,
    _resetAdvancedSearch,
    search,
    resetSearch,
    toggleItemSelected,
    selectAll,
    deselectAll,
    openCancelPlanningModal,
    openCancelAllCoverageModal,
    cancelPlanning,
    cancelAllCoverage,
    onAddCoverageClick,
    onAddPlanningClick,
    onPlanningFormSave,
    createCoverageFromNewsItem,
    saveFromPlanning,
    saveFromAuthoring,
}

export default self
