import React from 'react';
import PropTypes from 'prop-types';

import {PlanningDateTime} from '../Planning';

export const coverages = ({item, date, timeFormat, dateFormat, users, desks, activeFilter, contentTypes}) => (
    <PlanningDateTime
        item={item}
        date={date}
        timeFormat={timeFormat}
        dateFormat={dateFormat}
        users={users}
        desks={desks}
        activeFilter={activeFilter}
        contentTypes={contentTypes}
    />
);

coverages.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    date: PropTypes.string,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    activeFilter: PropTypes.string,
    contentTypes: PropTypes.array,
};
