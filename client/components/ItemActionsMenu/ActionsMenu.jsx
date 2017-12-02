import React from 'react'
import PropTypes from 'prop-types'
import { GENERIC_ITEM_ACTIONS } from '../../constants'
import { get } from 'lodash'
import { closeActionsMenu } from 'superdesk-core/scripts/apps/search/helpers'

export class ActionsMenu extends React.Component {

    triggerAction(action, event) {
        this.props.closeMenu(event)
        action.callback()
    }

    ignoreAction(event) {
        event.preventDefault()
        event.stopPropagation()
    }

    render() {
        const { actions } = this.props

        let items = actions.map(this.renderItem.bind(this))
        return(<ul className="dropdown__menu">
                <li onClick={this.ignoreAction.bind(this)}>
                    <div className="dropdown__menu-label">Actions<button className='dropdown__menu-close'
                        onClick={closeActionsMenu}>
                        <i className='icon-close-small' /></button>
                    </div>
                </li>
                <li className="dropdown__menu-divider" />
                {items}
            </ul>
        )
    }

    renderItem(action) {
        const key = action.key ? action.key : action.label

        if (Array.isArray(action.callback)) {
            let items = action.callback.map(this.renderItem.bind(this))

            if (!items.length) {
                items = <li><button onClick={this.props.closeMenu.bind(this)}>There are no actions available.</button></li>
            }

            const submenuDirection = get(action, 'direction', 'left')

            return (
                <li key={'submenu-' + key}>
                    <div className="dropdown">
                        <button className="dropdown__toggle" onClick={this.props.closeMenu.bind(this)}>
                            {action.icon && (<i className={action.icon}/>)}
                            {action.label}
                        </button>
                        <ul className={'dropdown__menu dropdown__menu--submenu-' + submenuDirection}>
                            {items}
                        </ul>
                    </div>
                </li>
            )
        }

        if (action.label === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            return <li key={key} className="dropdown__menu-divider" />
        }

        const trigger = this.triggerAction.bind(this, action)
        return (
            <li key={key}>
                <button className='ItemActionsMenu__action' onClick={trigger}>
                    {action.icon && (<i className={action.icon}/>)}
                    {action.label}
                </button>
            </li>
        )
    }
}


ActionsMenu.propTypes = {
    closeMenu: PropTypes.func.isRequired,
    actions: PropTypes.array.isRequired,
}
