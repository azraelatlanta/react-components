import { c } from 'ttag';
import PropTypes from 'prop-types';
import React from 'react';
import { Label, Select } from 'react-components';

const SelectAddressKeys = ({ Addresses, addressesKeys, addressIndex, setAddressIndex }) => {
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
            <div className="flex-self-vcenter p1">
                <Label htmlFor={selectId}>{label}</Label>
            </div>
            <div className="flex-item-fluid pt1 pb1">
                <Select
                    id={selectId}
                    value={addressIndex}
                    options={options}
                    onChange={({ target }) => setAddressIndex(+target.value)}
                />
            </div>
        </div>
    );
};

SelectAddressKeys.propTypes = {
    Addresses: PropTypes.array.isRequired,
    addressesKeys: PropTypes.object.isRequired,
    addressIndex: PropTypes.number.isRequired,
    setAddressIndex: PropTypes.func.isRequired
};

export default SelectAddressKeys;
