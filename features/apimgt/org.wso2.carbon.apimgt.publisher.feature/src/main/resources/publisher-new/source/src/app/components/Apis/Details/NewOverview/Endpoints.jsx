/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withAPI } from 'AppComponents/Apis/Details/components/ApiContext';

const showEndpoint = function (api, type) {
    if (api.endpointConfig) {
        if (type === 'prod') {
            return api.getProductionEndpoint();
        }
        if (type === 'sand') {
            return api.getSandboxEndpoint();
        }
    }
    return null;
};


/**
 *
 *
 * @param {*} props
 * @returns
 */
function Endpoints(props) {
    const { parentClasses, api } = props;

    return (
        <React.Fragment>
            <Grid container spacing={2}>
                <Grid item xs={12} md={12} lg={12} style={{ paddingBottom: 0 }}>
                    <div className={parentClasses.titleWrapper} style={{ marginTop: 20 }}>
                        <Typography variant='h5' component='h3' className={parentClasses.title}>
                            <FormattedMessage
                                id='Apis.Details.NewOverview.Endpoints.endpoints'
                                defaultMessage='Endpoints'
                            />
                        </Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    {/* Production Endpoint (TODO) fix the endpoint
                                            info when it's available with the api object */}
                    <Typography component='p' variant='subtitle2' className={parentClasses.subtitle}>
                        <FormattedMessage
                            id='Apis.Details.NewOverview.Endpoints.production.endpoint'
                            defaultMessage='Production Endpoint'
                        />
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6} lg={8}>
                    <Typography component='p' variant='body1'>
                        {showEndpoint(api, 'prod') &&
                            <React.Fragment>{showEndpoint(api, 'prod')}</React.Fragment>}
                    </Typography>
                    <Typography component='p' variant='body1' className={parentClasses.notConfigured}>
                        {!showEndpoint(api, 'prod') && (
                            <React.Fragment>
                                &lt;
                                <FormattedMessage
                                    id='Apis.Details.NewOverview.Endpoints.production.not.configured'
                                    defaultMessage='Not Configured'
                                />
                                &gt;
                            </React.Fragment>
                        )}
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    {/* Sandbox Endpoint (TODO) fix the endpoint info when
                                            it's available with the api object */}
                    <Typography component='p' variant='subtitle2' className={parentClasses.subtitle}>
                        <FormattedMessage
                            id='Apis.Details.NewOverview.Endpoints.sandbox.endpoint'
                            defaultMessage='Sandbox Endpoint'
                        />
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6} lg={8}>
                    <Typography component='p' variant='body1'>
                        {showEndpoint(api, 'sand') &&
                            <React.Fragment>{showEndpoint(api, 'sand')}</React.Fragment>}
                    </Typography>
                    <Typography component='p' variant='body1' className={parentClasses.notConfigured}>
                        {!showEndpoint(api, 'sand') && (
                            <React.Fragment>
                                &lt;
                                <FormattedMessage
                                    id='Apis.Details.NewOverview.Endpoints.sandbox.not.configured'
                                    defaultMessage='Not Configured'
                                />
                                &gt;
                            </React.Fragment>
                        )}
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    {/* Sandbox Endpoint (TODO) fix the endpoint info when
                                            it's available with the api object */}
                    <Typography component='p' variant='subtitle2' className={parentClasses.subtitle}>
                        <FormattedMessage
                            id='Apis.Details.NewOverview.Endpoints.endpoint.security'
                            defaultMessage='Endpoint Security'
                        />
                    </Typography>
                </Grid>
                <Grid item xs={12} md={6} lg={8}>
                    <Typography component='p' variant='body1'>
                        {api.endpointSecurity && <React.Fragment>{api.endpoint}</React.Fragment>}
                    </Typography>
                    <Typography component='p' variant='body1' className={parentClasses.notConfigured}>
                        {!api.endpointSecurity && <React.Fragment>&lt;Not configured&gt;</React.Fragment>}
                    </Typography>
                </Grid>
            </Grid>
        </React.Fragment>
    );
}

Endpoints.propTypes = {
    parentClasses: PropTypes.shape({}).isRequired,
    api: PropTypes.shape({}).isRequired,
};

export default withAPI(Endpoints);
