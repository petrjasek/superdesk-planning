import { AUTOSAVE } from '../constants';
import { get } from 'lodash';

/**
 * Action to save the dirty values for a form in the store
 * @param {string} formName - The same name given to redux-form
 * @param {object} diff - The list of dirty values to save in the store
 */
const save = (formName, diff) => ({
    type: AUTOSAVE.ACTIONS.SAVE,
    payload: {
        formName,
        diff,
    },
});

/**
 * Action to load the dirty values for a form from the store
 * @param {string} formName - The same name given to redux-form
 * @param {string} itemId - The item ID to retrieve the dirty values for
 * @returns {object} The dirty values or an empty object
 */
const load = (formName, itemId) => (
    (dispatch, getState) => (
        get(getState(), `autosave.${formName}.["${itemId}"]`, {})
    )
);

const self = {
    save,
    load,
};

export default self;
