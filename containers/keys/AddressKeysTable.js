import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import {
    Table,
    TableHeader,
    TableBody,
    Select,
    Alert,
    Loader,
    Label,
    Field
} from 'react-components';

import KeysTable from './KeysTable';
import AddressKeysRow from './AddressKeysRow';

const SelectAddress = ({ Addresses, addressesKeys, addressIndex, setAddressIndex }) => {
    const label = c('Title').t`Select address: `;

    const options = Addresses.map((address, i) => {
        const keys = addressesKeys && addressesKeys[address.ID] || [];
        const primaryKey = keys[0];
        const fingerprint = primaryKey ? primaryKey.fingerprint : '';
        const postfix = fingerprint ? ` (${fingerprint})` : '';
        return {
            text: address.Email + postfix,
            value: i
        };
    });

    const selectId = 'select-keys-address';

    return (
        <div className="flex">
            <div>
                <Label htmlFor={selectId}>{label}</Label>
            </div>
            <div className="flex-item-fluid">
                <Select
                    id={selectId}
                    value={addressIndex}
                    options={options}
                    onChange={({ target }) => setAddressIndex(target.value)}
                />
            </div>
        </div>
    );
};

SelectAddress.propTypes = {
    Addresses: PropTypes.array.isRequired,
    addressIndex: PropTypes.number.isRequired,
    setAddressIndex: PropTypes.func.isRequired
};

const AddressKeysTable = ({ onAction, Addresses, addressesKeys, loading }) => {
    const [addressIndex, setAddressIndex] = useState(() => Array.isArray(Addresses) ? 0 : -1);

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses) && Addresses.length) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    if (addressIndex === -1 || !addressesKeys) {
        return <Loader />
    }

    const selectedAddress = Addresses[addressIndex];
    const addressKeys = addressesKeys[selectedAddress.ID];

    const select = (
        <SelectAddress
            Addresses={Addresses}
            addressesKeys={addressesKeys}
            addressIndex={addressIndex}
            setAddressIndex={setAddressIndex}
        />
    );

    return (
        <>
            {Addresses.length > 0 ? select : null}
            <KeysTable loading={loading} keys={addressKeys} onAction={onAction} />
        </>
    );
};

AddressKeysTable.propTypes = {
    onAction: PropTypes.func.isRequired,
    addressesKeys: PropTypes.object,
    Addresses: PropTypes.array,
    loading: PropTypes.bool
};

export default AddressKeysTable;
