import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Select,
    Alert,
    Label,
} from 'react-components';

const SelectAddress = ({ Addresses, addressIndex, setAddressIndex }) => {
    const label = c('Title').t`Select address`;
    const notificationText = c('Alert').t`Select an address to which the new key will be attached`;

    const options = Addresses.map((address, i) => ({
        text: address.Email,
        value: i
    }));

    const selectId = 'select-address';

    return (
        <>
            <Alert>{notificationText}</Alert>
            <Label htmlFor={selectId}>{label}</Label>
            <Select
                id={selectId}
                value={addressIndex}
                options={options}
                onChange={({ target }) => setAddressIndex(target.value)}
            />
        </>
    );
};

SelectAddress.propTypes = {
    Addresses: PropTypes.array.isRequired,
    addressIndex: PropTypes.number.isRequired,
    setAddressIndex: PropTypes.func.isRequired
};

export default SelectAddress;
