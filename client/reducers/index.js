import { combineReducers } from 'redux'
import events from './events'
import modal from './modal'
import forms from './forms'
import planning from './planning'
import vocabularies from './vocabularies'
import agenda from './agenda'
import assignment from './assignment'
import locks from './locks'
import session from './session'
import workspace from './workspace'
import templates from './templates'
import main from './main';
import autosave from './autosave';

const returnState = (state) => state || {}

const planningApp = combineReducers({
    modal,
    events,
    vocabularies,
    planning,
    agenda,
    assignment,
    form: forms,
    locks,
    session,
    workspace,
    templates,
    main,
    autosave,

    // The following doesn't require reducers as they are loaded using sdPlanningService
    config: returnState,
    deployConfig: returnState,
    ingest: returnState,
    privileges: returnState,
    subjects: returnState,
    genres: returnState,
    users: returnState,
    desks: returnState,
    urgency: returnState,
    formsProfile: returnState,
})

export default planningApp
