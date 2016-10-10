import React from 'react'
import ReactDOM from 'react-dom'
import { Planning } from '../components'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

const loggerMiddleware = createLogger()

PlanningModalController.$inject = ['$element']
export function PlanningModalController($element) {
    let store = createStore(
        planningApp,
        undefined,
        applyMiddleware(thunkMiddleware, loggerMiddleware)
    )
    ReactDOM.render(
        <Provider store={store}>
            <Planning />
        </Provider>,
        $element.get(0)
    )
}
