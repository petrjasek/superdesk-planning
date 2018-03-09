import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {get} from 'lodash';
import {gettext} from '../../../utils';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {HistoryTab} from '../index';
import {PreviewContentTab, PreviewHeader} from './index';
import {Tabs} from '../../UI/Nav';
import {Panel} from '../../UI/Preview';
import {SidePanel, Header, Tools, Content} from '../../UI/SidePanel';
import {WORKSPACE} from '../../../constants';

export class PreviewPanelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0};

        this.openEditPanel = this.openEditPanel.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);

        this.tools = [
            {
                icon: 'icon-close-small',
                onClick: this.closePreview,
            },
        ];

        this.tabs = [
            {
                label: gettext('Content'),
                render: PreviewContentTab,
                enabled: true,
            },
            {
                label: gettext('History'),
                render: HistoryTab,
                enabled: true,
            },
        ];

        this.dom = {panel: null};
    }

    componentDidMount() {
        if (this.props.itemId && this.props.itemType) {
            this.props.loadPreviewItem(this.props.itemId, this.props.itemType);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'initialLoad') && this.props.initialLoad !== nextProps.initialLoad) {
            this.setActiveTab(0);
        }

        if (nextProps.itemId !== null && nextProps.itemId !== this.props.itemId) {
            // Using setTimeout allows the PreviewPanel to clear before displaying the new item
            setTimeout(() => {
                this.props.loadPreviewItem(nextProps.itemId, nextProps.itemType);
            }, 0);
        }

        if (this.props.inPlanning && get(nextProps, 'item')) {
            if (get(nextProps.item, 'state') !== 'spiked') {
                if (this.tools[0].icon !== 'icon-pencil') {
                    this.tools.unshift({
                        icon: 'icon-pencil',
                        onClick: this.openEditPanel,
                    });
                }
            } else if (this.tools[0].icon === 'icon-pencil') {
                this.tools.shift();
            }
        }
    }

    openEditPanel() {
        this.props.edit(this.props.item);
    }

    closePreview() {
        this.props.closePreview();
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    render() {
        const currentTab = this.tabs[this.state.tab];
        const RenderTab = currentTab.render;

        return (
            <Panel>
                <SidePanel shadowRight={true}>
                    <Header>
                        <Tools tools={this.tools}/>
                        <Tabs
                            tabs={this.tabs}
                            active={this.state.tab}
                            setActive={this.setActiveTab}
                        />
                    </Header>
                    {!this.props.previewLoading && this.props.item && (
                        <Content>
                            {currentTab.label !== 'History' &&
                            <PreviewHeader item={this.props.item}/>
                            }
                            <RenderTab item={this.props.item}/>
                        </Content>
                    )}
                </SidePanel>
            </Panel>
        );
    }
}

PreviewPanelComponent
    .propTypes = {
        item: PropTypes.object,
        edit: PropTypes.func.isRequired,
        closePreview: PropTypes.func.isRequired,
        initialLoad: PropTypes.bool,

        itemId: PropTypes.string,
        itemType: PropTypes.string,
        previewLoading: PropTypes.bool,
        loadPreviewItem: PropTypes.func,
        inPlanning: PropTypes.bool,
    };

const
    mapStateToProps = (state) => ({
        item: selectors.main.getPreviewItem(state),
        itemId: selectors.main.previewId(state),
        itemType: selectors.main.previewType(state),
        previewLoading: selectors.main.previewLoading(state),
        inPlanning: selectors.getCurrentWorkspace(state) === WORKSPACE.PLANNING,
    });

const
    mapDispatchToProps = (dispatch) => ({
        loadPreviewItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'preview'))
    });

export const
    PreviewPanel = connect(mapStateToProps, mapDispatchToProps)(PreviewPanelComponent);
