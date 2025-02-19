/*
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, { useEffect, useReducer, useState } from 'react';
import { styled } from '@mui/material/styles';
import API from 'AppData/api';
import base64url from 'base64url';
import PropTypes from 'prop-types';
import { useAppContext } from 'AppComponents/Shared/AppContext';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { FormattedMessage, useIntl } from 'react-intl';
import Select from '@mui/material//Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import FormDialogBase from 'AppComponents/AdminPages/Addons/FormDialogBase';
import Alert from 'AppComponents/Shared/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import { MuiChipsInput } from 'mui-chips-input';
import Error from '@mui/icons-material/Error';
import InputAdornment from '@mui/material/InputAdornment';
import { red } from '@mui/material/colors/';
import AddEditVhost from 'AppComponents/GatewayEnvironments/AddEditVhost';

const styles = {
    radioOutline: (theme) => ({
        display: 'flex',
        alignItems: 'center',
        width: '200px', // Set your desired width
        height: '125px', // Set your desired height
        padding: '4px', // Adjust the padding for the desired outline size
        marginRight: '30px',
        marginLeft: '10px',
        marginTop: '10px',
        marginBottom: '10px',
        border: '2px solid gray', // Initial border color
        borderRadius: '8px', // Adjust the border-radius for a square outline
        transition: 'border 0.3s', // Add transition for a smooth color change
        '&:hover': {
            border: '2px solid gray', // Keep the gray color on hover
        },
        '&.Mui-checked': {
            border: `2px solid ${theme.palette.primary.main}`, // Change to blue when selected
        },
    }),
    label: {
        marginLeft: '10px', // Adjust as needed for spacing between the radio button and label
    },
    newLabel: {
        backgroundColor: 'green', // Blue color
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.6rem',
        padding: '2px 4px', // Adjust padding as needed
        borderRadius: '4px', // Adjust border-radius for rounded corners
        marginLeft: '10px', // Adjust margin as needed
        display: 'inline-block', // Ensure inline display
    },
};

const StyledLabel = styled('span')({ ...styles.label, ...styles.newLabel });

const StyledSpan = styled('span')(({ theme }) => ({ color: theme.palette.error.dark }));

const useStyles = styled(() => ({
    chipInputBox: {
        marginRight: '30px',
        marginLeft: '10px',
        marginTop: '10px',
        marginBottom: '10px',
    },
}));

/**
 * Reducer
 * @param {JSON} state State
 * @param field form field
 * @param value value of field
 * @returns {Promise}.
 */
function reducer(state, { field, value }) {
    switch (field) {
        case 'name':
        case 'displayName':
        case 'gatewayType':
        case 'description':
        case 'type':
        case 'roles':
        case 'vhosts':
            return { ...state, [field]: value };
        case 'editDetails':
            return value;
        case 'permissionType':
            return {
                ...state,
                permissions: { ...state.permissions, [field]: value },
            };
        default:
            return state;
    }
}

/**
 * Render a pop-up dialog to add/edit a Gateway Environment
 * @param {JSON} props .
 * @returns {JSX}.
 */
function AddEditGWEnvironment(props) {
    const classes = useStyles();
    const intl = useIntl();
    const {
        updateList, dataRow, icon, triggerButtonText, title,
    } = props;

    const defaultVhost = {
        host: '', httpContext: '', httpsPort: 8243, httpPort: 8280, wssPort: 8099, wsPort: 9099, isNew: true,
    };
    const { settings } = useAppContext();
    const [validRoles, setValidRoles] = useState([]);
    const [invalidRoles, setInvalidRoles] = useState([]);
    const [roleValidity, setRoleValidity] = useState(true);
    const { gatewayTypes } = settings;
    const initialPermissions = dataRow && dataRow.permissions
        ? dataRow.permissions
        : { roles: [], permissionType: 'PUBLIC' };
    const [initialState, setInitialState] = useState(() => {
        return {
            displayName: '',
            description: '',
            gatewayType: gatewayTypes && gatewayTypes.length > 1 ? 'Regular' : gatewayTypes[0],
            type: 'hybrid',
            vhosts: [defaultVhost],
            permissions: initialPermissions,
        };
    });
    const [editMode, setIsEditMode] = useState(false);

    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        name, displayName, description, vhosts, type, gatewayType, permissions,
    } = state;

    const [roles, setRoles] = useState([]);

    useEffect(() => {
        if (permissions && permissions.roles) {
            setRoles(permissions.roles);
        }
    }, [permissions]);

    let permissionType = '';
    if (permissions) {
        permissionType = state.permissions.permissionType;
    }
    const handleRoleDeletion = (role) => {
        if (invalidRoles.includes(role)) {
            const invalidRolesArray = invalidRoles.filter((existingRole) => existingRole !== role);
            setInvalidRoles(invalidRolesArray);
            if (invalidRolesArray.length === 0) {
                setRoleValidity(true);
            }
        } else if (roles.includes(role)) {
            setRoles(roles.filter((existingRole) => existingRole !== role));
        } else {
            setValidRoles(validRoles.filter((existingRole) => existingRole !== role));
        }
    };

    const restApi = new API();
    const handleRoleAddition = (role) => {
        const promise = restApi.validateSystemRole(base64url.encode(role));
        promise
            .then(() => {
                // Check if the role is already added
                if (roles.includes(role) || validRoles.includes(role) || invalidRoles.includes(role)) {
                    Alert.error('Role already added: ' + role);
                    return;
                }

                setValidRoles(validRoles.concat(role));
                if (invalidRoles.length === 0) {
                    setRoleValidity(true);
                } else {
                    setRoleValidity(false);
                }
            })
            .catch((error) => {
                if (error.status === 404) {
                    setInvalidRoles(invalidRoles.concat(role));
                    setRoleValidity(false);
                } else {
                    Alert.error('Error when validating role: ' + role);
                    console.error('Error when validating role ' + error);
                }
            });
    };

    const onChange = (e) => {
        if (e.target.name === 'GatewayPermissionRestrict') {
            permissionType = e.target.value;
            dispatch({ field: 'permissionType', value: permissionType });
        }
        dispatch({ field: e.target.name, value: e.target.value });
    };

    const getBorderColor = (gatewayTypeNew) => {
        return gatewayType === gatewayTypeNew
            ? '2px solid #1976D2'
            : '2px solid gray';
    };

    useEffect(() => {
        setInitialState({
            displayName: '',
            description: '',
            gatewayType: '',
            type: 'hybrid',
            vhosts: [defaultVhost],
            permissions: {
                roles: [],
                permissionType: 'PUBLIC',
            },
        });
    }, []);

    const handleHostValidation = (vhost) => {
        if (!vhost) {
            return false;
        }
        if (!vhost.host) {
            return (
                intl.formatMessage({
                    id: 'GatewayEnvironments.AddEditGWEnvironment.form.vhost.host.empty',
                    defaultMessage: 'Host of Vhost is empty',
                })
            );
        }
        // same pattern used in admin Rest API
        const hostPattern = '^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9]'
            + '[A-Za-z0-9\\-]*[A-Za-z0-9])$';
        const hostRegex = new RegExp(hostPattern, 'g');
        const validHost = vhost.host && vhost.host.match(hostRegex);
        if (!validHost) {
            return (
                intl.formatMessage({
                    id: 'GatewayEnvironments.AddEditGWEnvironment.form.vhost.host.invalid',
                    defaultMessage: 'Invalid Host',
                })
            );
        }

        // same pattern used in admin Rest API
        const httpContextRegex = /^\/?([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])*$/g;
        // empty http context are valid
        const validHttpContext = !vhost.httpContext || vhost.httpContext.match(httpContextRegex);
        if (!validHttpContext) {
            return (
                intl.formatMessage({
                    id: 'GatewayEnvironments.AddEditGWEnvironment.form.vhost.context.invalid',
                    defaultMessage: 'Invalid Http context',
                })
            );
        }

        let portError;
        const ports = ['httpPort', 'httpsPort', 'wsPort', 'wssPort'];
        for (const port of ports) {
            portError = Number.isInteger(vhost[port]) && vhost[port] >= 1 && vhost[port] <= 65535 ? '' : 'Invalid Port';
            if (portError) {
                return portError;
            }
        }
        return false;
    };

    const hasErrors = (fieldName, value) => {
        let error;
        switch (fieldName) {
            case 'name':
                if (value === undefined) {
                    error = false;
                    break;
                }
                if (value === '') {
                    error = (
                        intl.formatMessage({
                            id: 'GatewayEnvironments.AddEditGWEnvironment.form.environment.name.empty',
                            defaultMessage: 'Name is Empty',
                        })
                    );
                } else if (!((/^[A-Za-z0-9_-]+$/)).test(value)) {
                    error = (
                        intl.formatMessage({
                            id: 'GatewayEnvironments.AddEditGWEnvironment.form.environment.name.invalid',
                            defaultMessage: 'Name must not contain special characters or spaces',
                        })
                    );
                } else {
                    error = false;
                }
                break;
            case 'displayName':
                if (!value) {
                    error = (
                        intl.formatMessage({
                            id: 'AdminPagesGatewayEnvironments.AddEditGWEnvironment.form.environment.displayName.empty',
                            defaultMessage: 'Display Name is Empty',
                        })
                    );
                } else {
                    error = false;
                }
                break;
            case 'vhosts': {
                if (value === undefined) {
                    error = false;
                    break;
                }
                if (value.length === 0) {
                    error = (
                        intl.formatMessage({
                            id: 'AdminPagesGatewayEnvironments.AddEditGWEnvironment.form.environment.vhost.empty',
                            defaultMessage: 'VHost is empty',
                        })
                    );
                    break;
                }
                const hosts = value.map((vhost) => vhost.host);
                if (hosts.length !== new Set(hosts).size) {
                    error = (
                        intl.formatMessage({
                            id: 'AdminPagesGatewayEnvironments.AddEditGWEnvironment.form.environment.vhost.duplicate',
                            defaultMessage: 'VHosts are duplicated',
                        })
                    );
                    break;
                }
                for (const host of value) {
                    error = handleHostValidation(host);
                    if (error) {
                        break;
                    }
                }
                break;
            }
            default:
                break;
        }
        return error;
    };
    const getAllFormErrors = () => {
        let errorText = '';
        if (name === undefined) {
            dispatch({ field: 'name', value: '' });
        }
        const nameErrors = hasErrors('name', name);
        const displayNameErrors = hasErrors('displayName', displayName);
        const vhostErrors = hasErrors('vhosts', vhosts);
        if (nameErrors) {
            errorText += nameErrors + '\n';
        }
        if (displayNameErrors) {
            errorText += displayNameErrors + '\n';
        }
        if (vhostErrors) {
            errorText += vhostErrors + '\n';
        }
        return errorText;
    };
    const formSaveCallback = () => {
        const formErrors = getAllFormErrors();
        if (formErrors !== '') {
            Alert.error(formErrors);
            return false;
        }
        const vhostDto = [];
        if (gatewayType === 'Regular') {
            vhosts.forEach((vhost) => {
                vhostDto.push({
                    host: vhost.host,
                    httpContext: vhost.httpContext,
                    httpPort: vhost.httpPort,
                    httpsPort: vhost.httpsPort,
                    wsPort: vhost.wsPort,
                    wssPort: vhost.wssPort,
                });
            });
        } else if (gatewayType === 'APK') {
            vhosts.forEach((vhost) => {
                vhostDto.push({
                    host: vhost.host,
                    httpContext: vhost.httpContext,
                    httpPort: vhost.httpPort,
                    httpsPort: vhost.httpsPort,
                });
            });
        }
        permissions.permissionType = state.permissions.permissionType;
        permissions.roles = roles.concat(validRoles);
        let promiseAPICall;
        if (dataRow) {
            // assign the update promise to the promiseAPICall
            promiseAPICall = restApi.updateGatewayEnvironment(
                dataRow.id, name.trim(), displayName, type, description, gatewayType, vhostDto, permissions,
            );
        } else {
            // assign the create promise to the promiseAPICall
            promiseAPICall = restApi.addGatewayEnvironment(name.trim(), displayName, type, description,
                gatewayType, vhostDto, permissions);
        }

        return promiseAPICall.then(() => {
            if (dataRow) {
                return (
                    intl.formatMessage({
                        id: 'GatewayEnvironments.AddEditGWEnvironment.form.info.edit.successful',
                        defaultMessage: 'Gateway Environment edited successfully',
                    })
                );
            } else {
                return (
                    intl.formatMessage({
                        id: 'GatewayEnvironments.AddEditGWEnvironment.form.info.add.successful',
                        defaultMessage: 'Gateway Environment added successfully',
                    })
                );
            }
        }).catch((error) => {
            const { response } = error;
            if (response.body) {
                throw (response.body.description);
            }
            return null;
        }).finally(() => {
            updateList();
        });
    };

    const dialogOpenCallback = () => {
        if (dataRow) {
            const {
                name: originalName,
                displayName: originalDisplayName,
                description: originalDescription,
                type: originalType,
                vhosts: originalVhosts,
                gatewayType: originalGatewayType,
                permissions: originalPermissions,
            } = dataRow;
            setIsEditMode(true);
            dispatch({
                field: 'editDetails',
                value: {
                    name: originalName,
                    displayName: originalDisplayName,
                    type: originalType,
                    gatewayType: originalGatewayType,
                    description: originalDescription,
                    vhosts: originalVhosts,
                    permissions: originalPermissions,
                },
            });
        }
    };

    return (
        <FormDialogBase
            title={title}
            saveButtonText={(
                <FormattedMessage
                    id='GatewayEnvironments.AddEditGWEnvironment.form.save.button.label'
                    defaultMessage='Save'
                />
            )}
            icon={icon}
            triggerIconProps={{ disabled: dataRow && dataRow.isReadOnly }}
            triggerButtonText={triggerButtonText}
            formSaveCallback={formSaveCallback}
            dialogOpenCallback={dialogOpenCallback}
            saveButtonDisabled={!roleValidity}
        >
            <FormControl
                variant='standard'
                component='fieldset'
                sx={(theme) => ({
                    minHeight: theme.spacing(40),
                    maxHeight: theme.spacing(100),
                    minWidth: theme.spacing(55),
                })}
            >
                <TextField
                    autoFocus
                    margin='dense'
                    name='name'
                    value={name}
                    onChange={onChange}
                    label={(
                        <span>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.name'
                                defaultMessage='Name'
                            />
                            <StyledSpan>*</StyledSpan>
                        </span>
                    )}
                    fullWidth
                    error={hasErrors('name', name)}
                    helperText={hasErrors('name', name) || (
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.name.help'
                            defaultMessage='Name of the Gateway Environment'
                        />
                    )}
                    variant='outlined'
                    disabled={editMode}
                />
                <TextField
                    margin='dense'
                    name='displayName'
                    value={displayName}
                    onChange={onChange}
                    label={(
                        <span>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.displayName'
                                defaultMessage='Display Name'
                            />
                            <StyledSpan>*</StyledSpan>
                        </span>
                    )}
                    fullWidth
                    helperText={(
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.displayName.help'
                            defaultMessage='Display name of the Gateway Environment'
                        />
                    )}
                    variant='outlined'
                />
                <TextField
                    margin='dense'
                    name='description'
                    value={description}
                    onChange={onChange}
                    label={(
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.description.label'
                            defaultMessage='Description'
                        />
                    )}
                    fullWidth
                    multiline
                    helperText={(
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.description.help'
                            defaultMessage='Description of the Gateway Environment'
                        />
                    )}
                    variant='outlined'
                />
                {gatewayTypes && gatewayTypes.length > 1 && (
                    <FormControl component='fieldset'>
                        <FormLabel style={{ marginTop: '10px' }}>
                            <FormattedMessage
                                id={'GatewayEnvironments.AddEditGWEnvironment.form.'
                                    + 'gateway.type.label'}
                                defaultMessage='Select Gateway type'
                            />
                        </FormLabel>
                        <RadioGroup
                            row
                            aria-label='gateway-type'
                            name='gateway-type'
                            value={gatewayType}
                            onChange={onChange}
                        >
                            <FormControlLabel
                                value='Regular'
                                name='gatewayType'
                                sx={styles.radioOutline}
                                control={<Radio />}
                                disabled={editMode}
                                label={(
                                    <div>
                                        <span>
                                            <FormattedMessage
                                                id={'GatewayEnvironments.AddEditGWEnvironment.form.'
                                                    + 'gateway.type.regular'}
                                                defaultMessage='Regular Gateway'
                                            />
                                        </span>
                                        <Typography variant='body2' color='textSecondary'>
                                            <FormattedMessage
                                                id={'GatewayEnvironments.AddEditGWEnvironment.form.'
                                                    + 'gateway.type.regular.description'}
                                                defaultMessage={'API gateway embedded in APIM runtime.'
                                                    + ' Connect directly to an existing APIManager.'}
                                            />
                                        </Typography>
                                    </div>
                                )}
                                style={{ border: getBorderColor('Regular') }}
                            />
                            <FormControlLabel
                                value='APK'
                                name='gatewayType'
                                sx={styles.radioOutline}
                                control={<Radio />}
                                disabled={editMode}
                                label={(
                                    <div>
                                        <span>
                                            <FormattedMessage
                                                id={'GatewayEnvironments.AddEditGWEnvironment.form.'
                                                        + 'gateway.type.apk'}
                                                defaultMessage='APK Gateway'
                                            />
                                        </span>
                                        <StyledLabel>
                                            <FormattedMessage
                                                id={'GatewayEnvironments.AddEditGWEnvironment.form.'
                                                    + 'gateway.type.apk.new.label'}
                                                defaultMessage='New'
                                            />
                                        </StyledLabel>
                                        <Typography variant='body2' color='textSecondary'>
                                            <FormattedMessage
                                                id={'GatewayEnvironments.AddEditGWEnvironment.form.'
                                                    + 'gateway.type.apk.description'}
                                                defaultMessage={'Fast API gateway running on kubernetes '
                                                    + 'designed to manage and secure APIs.'}
                                            />
                                        </Typography>
                                    </div>
                                )}
                                style={{ border: getBorderColor('APK') }}
                            />
                        </RadioGroup>
                    </FormControl>
                )}
                <FormControl
                    component='fieldset'
                    variant='outlined'
                    margin='dense'
                    style={{ marginTop: '10px', marginBottom: '10px' }}
                >
                    <InputLabel id='demo-simple-select-label'>
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.type.label'
                            defaultMessage='Type'
                        />
                    </InputLabel>
                    <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        value={type}
                        name='type'
                        label={(
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.type.label'
                                defaultMessage='Type'
                            />
                        )}
                        onChange={onChange}
                        disabled={editMode}
                    >
                        <MenuItem value='hybrid'>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.type.hybrid.option'
                                defaultMessage='Hybrid'
                            />
                        </MenuItem>
                        <MenuItem value='production'>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.type.prod.option'
                                defaultMessage='Production'
                            />
                        </MenuItem>
                        <MenuItem value='sandbox'>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.type.sandbox.option'
                                defaultMessage='Sandbox'
                            />
                        </MenuItem>
                    </Select>
                    <FormHelperText>
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.type.helper.text'
                            defaultMessage='Supported Key Type of the Gateway Environment'
                        />
                    </FormHelperText>
                </FormControl>
                {/* Permissions */}
                <FormControl
                    component='fieldset'
                    variant='outlined'
                    margin='dense'
                    style={{ marginTop: '10px', marginBottom: '10px' }}
                >
                    <InputLabel id='demo-simple-select-label'>
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.permissions'
                            defaultMessage='Permission'
                        />
                    </InputLabel>
                    <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        value={permissionType}
                        name='GatewayPermissionRestrict'
                        label={(
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.permissions.select'
                                defaultMessage='Permission'
                            />
                        )}
                        onChange={onChange}
                    >
                        <MenuItem key='PUBLIC' value='PUBLIC'>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.permission.public.option'
                                defaultMessage='Public'
                            />
                        </MenuItem>
                        <MenuItem key='ALLOW' value='ALLOW'>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.permission.allow.option'
                                defaultMessage='Allow for role(s)'
                            />
                        </MenuItem>
                        <MenuItem key='DENY' value='DENY'>
                            <FormattedMessage
                                id='GatewayEnvironments.AddEditGWEnvironment.form.permission.deny.option'
                                defaultMessage='Deny for role(s)'
                            />
                        </MenuItem>
                    </Select>
                    <FormHelperText>
                        <FormattedMessage
                            id='GatewayEnvironments.AddEditGWEnvironment.form.Permission.helper.text'
                            defaultMessage='Permissions for the Gateway Environment'
                        />
                    </FormHelperText>
                    <Box component='div' m={1}>
                        {
                            (permissionType === 'ALLOW' || permissionType === 'DENY')
                            && (
                                <Box
                                    display='flex'
                                    flexDirection='row'
                                    alignItems='center'
                                    margin='dense'
                                    classes={{ root: classes.chipInputBox }}
                                >
                                    <MuiChipsInput
                                        fullWidth
                                        label='Roles'
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        name='GatewayEnvironmentPermissions'
                                        variant='outlined'
                                        value={roles.concat(validRoles, invalidRoles)}
                                        alwaysShowPlaceholder={false}
                                        placeholder='Enter roles and press Enter'
                                        blurBehavior='clear'
                                        data-testid='gateway-permission-roles'
                                        InputProps={{
                                            endAdornment: !roleValidity && (
                                                <InputAdornment
                                                    position='end'
                                                    sx={{
                                                        position: 'absolute',
                                                        right: '25px',
                                                        top: '50%',
                                                    }}
                                                >
                                                    <Error color='error' />
                                                </InputAdornment>
                                            ),
                                        }}
                                        onAddChip={handleRoleAddition}
                                        renderChip={(ChipComponent, key, ChipProps) => (
                                            <ChipComponent
                                                key={ChipProps.label}
                                                label={ChipProps.label}
                                                onDelete={() => handleRoleDeletion(ChipProps.label)}
                                                data-testid={ChipProps.label}
                                                style={{
                                                    backgroundColor:
                                                        invalidRoles.includes(ChipProps.label)
                                                            ? red[300] : null,
                                                    margin: '8px 8px 8px 0',
                                                    float: 'left',
                                                }}
                                            />
                                        )}
                                        error={!roleValidity}
                                        helperText={
                                            !roleValidity ? (
                                                <FormattedMessage
                                                    id='Gateway.AddEditGWEnvironment.permission.Invalid'
                                                    defaultMessage='Invalid Role(s) Found'
                                                />
                                            ) : [
                                                (permissionType === 'ALLOW'
                                                    ? (
                                                        <FormattedMessage
                                                            id='Gateway.AddEditGWEnvironment.permission.allowed'
                                                            defaultMessage='Use of this Gateway Environment is
                                                                "Allowed" for above roles.'
                                                        />
                                                    )
                                                    : (
                                                        <FormattedMessage
                                                            id='Gateway.AddEditGWEnvironment.permission.denied'
                                                            defaultMessage='Use of this Gateway Environment is
                                                                "Denied" for above roles.'
                                                        />
                                                    )
                                                ),
                                                ' ',
                                                <FormattedMessage
                                                    id='Gateway.AddEditGWEnvironment.permission.help'
                                                    defaultMessage='Enter a valid role and press `Enter`'
                                                />,
                                            ]
                                        }
                                    />
                                </Box>
                            )
                        }
                    </Box>
                </FormControl>
                <AddEditVhost
                    initialVhosts={vhosts}
                    onVhostChange={onChange}
                    gatewayType={gatewayType}
                />
            </FormControl>
        </FormDialogBase>
    );
}

AddEditGWEnvironment.defaultProps = {
    icon: null,
    dataRow: null,
};

AddEditGWEnvironment.propTypes = {
    updateList: PropTypes.func.isRequired,
    dataRow: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        isReadOnly: PropTypes.bool.isRequired,
        vhosts: PropTypes.shape([]),
    }),
    icon: PropTypes.element,
    triggerButtonText: PropTypes.shape({}).isRequired,
    title: PropTypes.shape({}).isRequired,
};

export default AddEditGWEnvironment;
