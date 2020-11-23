/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Icon from '@material-ui/core/Icon';
import Typography from '@material-ui/core/Typography';
import MUIDataTable from 'mui-datatables';
import { FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Progress } from 'AppComponents/Shared';
import ResourceNotFound from 'AppComponents/Base/Errors/ResourceNotFound';
import Alert from 'AppComponents/Shared/Alert';
import ServiceCatalog from 'AppData/ServiceCatalog';
import Onboarding from 'AppComponents/ServiceCatalog/Listing/Onboarding';
import Delete from 'AppComponents/ServiceCatalog/Listing/Delete';
import Grid from '@material-ui/core/Grid';
import Help from '@material-ui/icons/Help';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme) => ({
    contentInside: {
        padding: theme.spacing(3),
        paddingTop: theme.spacing(2),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        '& > div[class^="MuiPaper-root-"]': {
            boxShadow: 'none',
            backgroundColor: 'transparent',
        },
    },
    serviceNameLink: {
        display: 'flex',
        alignItems: 'center',
        '& span': {
            marginLeft: theme.spacing(),
        },
        '& span.material-icons': {
            marginLeft: 0,
            color: '#444',
            marginRight: theme.spacing(),
            fontSize: 18,
        },
    },
    buttonStyle: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
        marginRight: theme.spacing(2),
    },
    textStyle: {
        fontSize: 11,
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        paddingBottom: theme.spacing(3),
    },
    helpDiv: {
        marginTop: theme.spacing(0.5),
    },
    helpIcon: {
        fontSize: 20,
    },
    horizontalDivider: {
        marginTop: theme.spacing(3),
        borderTop: '0px',
        width: '100%',
    },
    tableStyle: {
        marginTop: theme.spacing(4),
    },
    serviceNameStyle: {
        color: theme.palette.primary.main,
    },
});

/**
 * Listing for service catalog entries
 *
 * @class Listing
 * @extends {React.Component}
 */
class Listing extends React.Component {
    /**
     * @inheritdoc
     * @param {*} props properties
     * @memberof Listing
     */
    constructor(props) {
        super(props);
        this.state = {
            serviceList: null,
            notFound: true,
            loading: true,
        };
        this.page = 0;
        this.count = 100;
        this.rowsPerPage = localStorage.getItem('serviceCatalog.rowsPerPage') || 10;
        this.updateData = this.updateData.bind(this);
    }

    componentDidMount() {
        this.getData();
    }

    componentDidUpdate(prevProps) {
        const { query } = this.props;
        if (query !== prevProps.query) {
            this.getData();
        }
    }

    componentWillUnmount() {
        // The following is resetting the styles for the mui-datatables
        const { theme } = this.props;
        const themeAdditions = {
            overrides: {
                MUIDataTable: {
                    tableRoot: {
                        display: 'table',
                        '& tbody': {
                            display: 'table-row-group',
                        },
                        '& thead': {
                            display: 'table-header-group',
                        },
                    },
                },
            },
        };
        Object.assign(theme, themeAdditions);
    }

    // Get Services
    getData = () => {
        const { intl } = this.props;
        this.xhrRequest().then((data) => {
            const { body } = data;
            const { list, pagination } = body;
            const { total } = pagination;
            // When there is a count stored in the localstorage and it's greater than 0
            // We check if the response in the rest api calls have 0 items.
            // We remove the local storage and redo the api call
            if (this.count > 0 && total === 0) {
                this.page = 0;
                this.getData();
            }
            this.count = total;
            this.setState({ serviceList: list, notFound: false });
        }).catch(() => {
            Alert.error(intl.formatMessage({
                defaultMessage: 'Error While Loading Services',
                id: 'ServiceCatalog.Listing.Listing.error.loading',
            }));
        }).finally(() => {
            this.setState({ loading: false });
        });
    };

    changePage = (page) => {
        this.page = page;
        const { intl } = this.props;
        this.setState({ loading: true });
        this.xhrRequest().then((data) => {
            const { body } = data;
            const { list } = body;
            this.setState({
                serviceList: list,
                notFound: false,
            });
        }).catch(() => {
            Alert.error(intl.formatMessage({
                defaultMessage: 'Error While Loading Services',
                id: 'ServiceCatalog.Listing.Listing.on.change.error.loading',
            }));
        })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    xhrRequest = () => {
        const { page, rowsPerPage } = this;
        const { query } = this.props;
        if (query) {
            const composeQuery = queryString.parse(query);
            composeQuery.limit = this.rowsPerPage;
            composeQuery.offset = page * rowsPerPage;
            return ServiceCatalog.searchServices(composeQuery);
        }
        return ServiceCatalog.searchServices({ limit: this.rowsPerPage, offset: page * rowsPerPage });
    };

    /**
     *
     * Update Services list if a Service gets deleted
     * @memberof Listing
     */
    updateData() {
        const { page, rowsPerPage, count } = this;
        if (count - 1 === rowsPerPage * page && page !== 0) {
            this.page = page - 1;
        }
        this.getData();
    }

    /**
     *
     *
     * @returns
     * @memberof Listing
     */
    render() {
        const {
            intl, classes, query,
        } = this.props;
        const { loading } = this.state;
        const columns = [
            {
                name: 'id',
                options: {
                    display: 'excluded',
                    filter: false,
                },
            },
            {
                name: 'name',
                label: intl.formatMessage({
                    id: 'ServiceCatalog.Listing.Listing.name',
                    defaultMessage: 'Service',
                }),
                options: {
                    customBodyRender: (value, tableMeta, updateValue, tableViewObj = this) => {
                        if (tableMeta.rowData) {
                            const artifact = tableViewObj.state.serviceList[tableMeta.rowIndex];
                            const serviceName = tableMeta.rowData[1];
                            if (artifact) {
                                return (
                                    <div className={classes.serviceNameStyle}>
                                        <span>{serviceName}</span>
                                    </div>
                                );
                            }
                        }
                        return <span />;
                    },
                    sort: false,
                    filter: false,
                },
            },
            {
                name: 'serviceUrl',
                label: intl.formatMessage({
                    id: 'ServiceCatalog.Listing.Listing.service.url',
                    defaultMessage: 'Service URL',
                }),
                options: {
                    sort: false,
                },
            },
            {
                name: 'definitionType',
                label: intl.formatMessage({
                    id: 'ServiceCatalog.Listing.Listing.service.type',
                    defaultMessage: 'Service Type',
                }),
                options: {
                    sort: false,
                },
            },
            {
                name: 'definitionType',
                label: intl.formatMessage({
                    id: 'ServiceCatalog.Listing.Listing.schema.type',
                    defaultMessage: 'Schema Type',
                }),
                options: {
                    sort: false,
                },
            },
            {
                name: 'version',
                label: intl.formatMessage({
                    id: 'ServiceCatalog.Listing.Listing.version',
                    defaultMessage: 'Version',
                }),
                options: {
                    sort: false,
                },
            },
            {
                name: 'usage',
                label: intl.formatMessage({
                    id: 'ServiceCatalog.Listing.Listing.usage',
                    defaultMessage: 'No. Of APIs',
                }),
                options: {
                    sort: false,
                },
            },
            {
                options: {
                    customBodyRender: (value, tableMeta) => {
                        if (tableMeta.rowData) {
                            const serviceId = tableMeta.rowData[0];
                            const serviceName = tableMeta.rowData[1];
                            return (
                                <Box display='flex' flexDirection='row'>
                                    <Link>
                                        <Button color='primary' variant='outlined' className={classes.buttonStyle}>
                                            <Typography className={classes.textStyle}>
                                                <FormattedMessage
                                                    id='ServiceCatalog.Listing.Listing.create.api'
                                                    defaultMessage='Create API'
                                                />
                                            </Typography>
                                        </Button>
                                    </Link>
                                    <Button>
                                        <Icon>edit</Icon>
                                    </Button>
                                    <Delete serviceName={serviceName} serviceId={serviceId} getData={this.getData} />
                                </Box>
                            );
                        }
                        return false;
                    },
                    sort: false,
                    name: 'actions',
                    label: '',
                },
            },
        ];
        const { page, count, rowsPerPage } = this;
        const {
            serviceList, notFound,
        } = this.state;
        const options = {
            filterType: 'dropdown',
            rowsPerPageOptions: [5, 10, 25, 50, 100],
            responsive: 'stacked',
            serverSide: true,
            search: true,
            count,
            page,
            onTableChange: (action, tableState) => {
                switch (action) {
                    case 'changePage':
                        this.changePage(tableState.page);
                        break;
                    default:
                        break;
                }
            },
            selectableRows: 'none',
            rowsPerPage,
            onChangeRowsPerPage: (numberOfRows) => {
                this.rowsPerPage = numberOfRows;
                if (page * numberOfRows > count) {
                    this.page = 0;
                } else if (count - 1 === rowsPerPage * page && page !== 0) {
                    this.page = page - 1;
                }
                localStorage.setItem('serviceCatalog.rowsPerPage', numberOfRows);
                this.getData();
            },
        };
        options.customRowRender = null;
        options.title = true;
        options.filter = false;
        options.print = true;
        options.download = true;
        options.viewColumns = false;
        if (page === 0 && this.count <= rowsPerPage && rowsPerPage === 10) {
            options.pagination = false;
        } else {
            options.pagination = true;
        }
        if (loading || !serviceList) {
            return <Progress per={90} message='Loading Services ...' />;
        }
        if (notFound) {
            return <ResourceNotFound />;
        }
        if (serviceList.length === 0 && !query) {
            return (
                <Onboarding />
            );
        }

        return (
            <>
                <div className={classes.content}>
                    <div className={classes.contentInside}>
                        <Grid container direction='row' spacing={10}>
                            <Grid item md={11}>
                                <Typography className={classes.heading} variant='h4'>
                                    <FormattedMessage
                                        id='ServiceCatalog.Listing.Listing.heading'
                                        defaultMessage='Service Catalog'
                                    />
                                </Typography>
                            </Grid>
                            <Grid item md={1}>
                                <Tooltip
                                    placement='right'
                                    title={(
                                        <FormattedMessage
                                            id='ServiceCatalog.Listing.Listing.help.tooltip'
                                            defaultMessage='The Service Catalog enables API-first Integration'
                                        />
                                    )}
                                >
                                    <div className={classes.helpDiv}>
                                        <Help className={classes.helpIcon} />
                                    </div>
                                </Tooltip>
                            </Grid>
                        </Grid>
                        <hr className={classes.horizontalDivider} />
                        <div className={classes.tableStyle}>
                            <MUIDataTable title='' data={serviceList} columns={columns} options={options} />
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default injectIntl(withStyles(styles, { withTheme: true })(Listing));

Listing.propTypes = {
    classes: PropTypes.shape({}).isRequired,
    intl: PropTypes.shape({ formatMessage: PropTypes.func.isRequired }).isRequired,
    theme: PropTypes.shape({
        custom: PropTypes.string,
    }).isRequired,
    query: PropTypes.string,
};

Listing.defaultProps = {
    query: '',
};
