import React from 'react';
import PropTypes from 'prop-types';
import DebounceInput from 'react-debounce-input';
import {uniqueId} from 'lodash';

export default class SearchField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // initialize state from props
            searchInputValue: this.props.value || '',
            uniqueId: uniqueId('SearchField'),
        };
    }

    /** Reset the field value, close the search bar and load events */
    resetSearch() {
        this.setState({
            searchInputValue: '',
        });
        this.props.onSearch();
    }

    /** Search events by keywords */
    onSearchChange(event) {
        const value = event.target.value;

        this.setState(
            {searchInputValue: value || ''},
            // update the input value since we are using the DebounceInput `value` prop
            () => this.props.onSearch(value)
        );
    }

    onSearchClick(event) {
        this.setState(() => this.props.onSearchClick());
    }

    render() {
        const {uniqueId} = this.state;
        const minLength = this.props.minLength ? this.props.minLength : 2;

        return (
            <DebounceInput
                minLength={minLength}
                debounceTimeout={800}
                value={this.state.searchInputValue}
                onChange={this.onSearchChange.bind(this)}
                onClick={this.onSearchClick.bind(this)}
                id={uniqueId}
                placeholder="Search"
                className="sd-line-input__input"
                type="text"
                ref="searchInput" />
        );
    }
}

SearchField.propTypes = {
    onSearch: PropTypes.func.isRequired,
    onSearchClick: PropTypes.func.isRequired,
    value: PropTypes.string,
    minLength: PropTypes.number,
};
