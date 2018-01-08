import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {Popup} from '../../';
import {DayPicker} from './DayPicker';
import {MonthPicker} from './MonthPicker';
import {YearPicker} from './YearPicker';
import './style.scss';

export class DateInputPopup extends React.Component {
    constructor(props) {
        super(props);
        const currentDate = moment();

        this.state = {
            mode: 'day',
            modeTitle: this.getModeTitle(currentDate, 'day'),
            currentDate: currentDate,
            selectedDate: currentDate,
        };

        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
    }

    componentWillMount() {
        const {value} = this.props;

        if (value && moment.isMoment(value)) {
            this.setState({
                mode: 'day',
                modeTitle: this.getModeTitle(value, 'day'),
                selectedDate: value.clone()
            });
        }
    }

    handleModeChange() {
        const maxMode = this.props.maxMode || 'year';

        if (this.state.mode === 'day' && maxMode !== 'month') {
            this.setState({
                mode: 'month',
                modeTitle: this.getModeTitle(this.state.selectedDate, 'month'),
            });
        } else if (this.state.mode === 'month') {
            this.setState({
                mode: 'year',
                modeTitle: this.getModeTitle(this.state.selectedDate, 'year'),
            });
        }
    }

    getFurtherValues(direction) {
        let diff = 1, diffType = '';

        switch (this.state.mode) {
        case 'day':
            // Have to change the month to previous value
            diffType = 'months';
            break;
        case 'month':
            // Have to change the year to previous value
            diffType = 'years';
            break;
        case 'year':
            diff = 20;
            diffType = 'years';
            break;
        }

        const newDate = direction ?
            this.state.selectedDate.clone().add(diff, diffType) :
            this.state.selectedDate.clone().subtract(diff, diffType);

        this.setState({
            modeTitle: this.getModeTitle(newDate, this.state.mode),
            selectedDate: newDate,
        });
    }

    handleConfirm(toolSelect /* 0-Today, 1-Tomorrow, 2-In two days*/) {
        const {onChange, close} = this.props;
        const {currentDate} = this.state;

        switch (toolSelect) {
        case 0:
            onChange(currentDate);
            break;
        case 1:
            onChange(currentDate.clone().add(1, 'days'));
            break;
        case 2:
            onChange(currentDate.clone().add(2, 'days'));
            break;
        }

        close();
    }

    getStartingYearForYearPicker(date) {
        const yearRange = this.props.yearRange || 20;

        return parseInt((date.year() - 1) / yearRange, 10) * yearRange + 1;
    }

    getModeTitle(date, mode) {
        const yearRange = this.props.yearRange || 20;

        switch (mode) {
        case 'day': return date.format('MMMM YYYY');
        case 'month': return date.format('YYYY');
        case 'year':
            return this.getStartingYearForYearPicker(date) + '-' +
                (this.getStartingYearForYearPicker(date) + yearRange - 1);
        }
    }

    handleSelectChange(newDate) {
        let nextMode = '';

        switch (this.state.mode) {
        case 'month':
            nextMode = 'day';
            break;
        case 'year':
            nextMode = 'month';
            break;
        }

        if (this.state.mode === 'day') {
            this.props.onChange(newDate);
            this.props.close();
        } else {
            this.setState({
                selectedDate: newDate,
                mode: nextMode,
                modeTitle: this.getModeTitle(newDate, nextMode),
            });
        }
    }

    render() {
        return (
            <Popup
                close={this.props.close}
                target={this.props.target}
            >
                <div className="datepickerPopup">
                    <div className="datepickerPopup__Additional">
                        <table>
                            <tbody>
                                <tr>
                                    <td><button
                                        type="button"
                                        className="btn btn--mini"
                                        onClick={this.handleConfirm.bind(this, 0)}>Today</button></td>
                                    <td><button
                                        type="button"
                                        className="btn btn--mini"
                                        onClick={this.handleConfirm.bind(this, 1)}>Tomorrow</button></td>
                                    <td><button
                                        type="button"
                                        className="btn btn--mini"
                                        onClick={this.handleConfirm.bind(this, 2)}>In 2 days</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="datepickerPopup__Tools">
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-default btn-sm pull-left">
                                            <i className="icon-chevron-left-thin"
                                                onClick={this.getFurtherValues.bind(this, 0)}/>
                                        </button></td>
                                    <td>
                                        <button
                                            type="button"
                                            aria-live="assertive"
                                            aria-atomic="true"
                                            className="btn btn-default btn-sm"
                                            onClick={this.handleModeChange}>
                                            <strong>{this.state.modeTitle}</strong>
                                        </button></td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-default btn-sm pull-right"
                                            onClick={this.getFurtherValues.bind(this, 1)}>
                                            <i className="icon-chevron-right-thin"/>
                                        </button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="datepickerPopup__core">
                        { this.state.mode === 'day' && (
                            <DayPicker
                                selectedDate={this.state.selectedDate}
                                onChange={this.handleSelectChange} />
                        )}
                        { this.state.mode === 'month' && (
                            <MonthPicker
                                selectedDate={this.state.selectedDate}
                                onChange={this.handleSelectChange} />
                        )}
                        { this.state.mode === 'year' && (
                            <YearPicker
                                startingYear={this.getStartingYearForYearPicker(this.state.selectedDate)}
                                selectedDate={this.state.selectedDate} onChange={this.handleSelectChange} />
                        )}
                    </div>
                    <button
                        className="btn btn--small pull-right"
                        type="button"
                        onClick={this.props.close}>Cancel</button>
                </div>
            </Popup>
        );
    }
}

DateInputPopup.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
    maxMode: PropTypes.string,
    yearRange: PropTypes.number,
};