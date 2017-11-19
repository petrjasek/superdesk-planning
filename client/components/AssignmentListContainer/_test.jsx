import { createTestStore } from '../../utils'
import { restoreSinonStub } from '../../utils/testUtils'
import { mount } from 'enzyme'
import { AssignmentListContainer } from './index'
import React from 'react'
import sinon from 'sinon'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

describe('<AssignmentListContainer />', () => {
    const initialState = {
        assignment: {
            assignments: {
                1: {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 'desk1',
                        },
                        scheduled: '2017-07-28T11:16:36+0000',
                        slugline: 'slugline',
                        headline: 'headline',
                    },
                },
            },
            filterBy: 'All',
            searchQuery: 'test',
            orderByField: 'Updated',
            orderDirection: 'Desc',
            lastAssignmentLoadedPage: 1,
            previewOpened: true,
            currentAssignmentId: 1,
            assignmentsInList: [1],
            readOnly: true,
        },
        session: { identity: { _id: 'user1' } },
    }


    afterEach(() => {
        restoreSinonStub(actions.assignments.ui.loadAssignments)
    })

    it('check container components', () => {
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )
        expect(wrapper.find('SearchBar').length).toBe(1)
        expect(wrapper.find('OrderBar').length).toBe(1)
        expect(wrapper.find('.search-handler').length).toBe(1)
        expect(wrapper.find('EditAssignment').length).toBe(1)
    })

    it('invokes loadAssignments for all list groups when searchQuery is changed', () => {
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )

        sinon.stub(actions.assignments.ui, 'loadAssignments').callsFake(() => (
            () => (Promise.resolve())
        ))

        const component = wrapper.find('AssignmentListContainerComponent')
        component.node.changeSearchQuery('searchText')
        expect(actions.assignments.ui.loadAssignments.callCount).toBe(3)
    })

    it('invokes loadAssignments for all list groups when filterBy is changed', () => {
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )

        sinon.stub(actions.assignments.ui, 'loadAssignments').callsFake(() => (
            () => (Promise.resolve())
        ))

        const component = wrapper.find('AssignmentListContainerComponent')
        component.node.changeFilter('User')
        expect(actions.assignments.ui.loadAssignments.callCount).toBe(3)
    })

    it('invokes loadAssignments for all list groups when orderBy is changed', () => {
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )

        sinon.stub(actions.assignments.ui, 'loadAssignments').callsFake(() => (
            () => (Promise.resolve())
        ))

        const component = wrapper.find('AssignmentListContainerComponent')
        component.node.changeFilter(null, 'Updated')
        expect(actions.assignments.ui.loadAssignments.callCount).toBe(3)
    })

    it('invokes loadAssignments for all list groups when orderDirection is changed', () => {
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )

        sinon.stub(actions.assignments.ui, 'loadAssignments').callsFake(() => (
            () => (Promise.resolve())
        ))

        const component = wrapper.find('AssignmentListContainerComponent')
        component.node.changeFilter(null, null, 'desc')
        expect(actions.assignments.ui.loadAssignments.callCount).toBe(3)
    })

    it('loadsAssignment for each list group on its mounting', () => {
        sinon.stub(actions.assignments.ui, 'loadAssignments').callsFake(() => (
            () => (Promise.resolve())
        ))

        const store = createTestStore({ initialState })
        mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )
        expect(actions.assignments.ui.loadAssignments.callCount).toBe(3)
    })
})