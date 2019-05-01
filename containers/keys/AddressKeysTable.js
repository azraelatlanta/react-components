import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Loader } from 'react-components';

import SelectAddressKeys from './shared/SelectAddressKeys';
import KeysTable from './KeysTable';


const AddressKeysTable = ({ onAction, Addresses, addressesKeys, loading }) => {
    const [addressIndex, setAddressIndex] = useState(() => Array.isArray(Addresses) ? 0 : -1);

    useEffect(() => {
        if (addressIndex === -1 && Array.isArray(Addresses)) {
            setAddressIndex(0);
        }
    }, [addressIndex, Addresses]);

    if (addressIndex === -1 || !addressesKeys) {
        return <Loader />
    }

    if (!Addresses.length) {
        return null;
    }

    const selectedAddress = Addresses[addressIndex];
    const addressKeys = addressesKeys[selectedAddress.ID];

    const select = (
        <SelectAddressKeys
            Addresses={Addresses}
            addressesKeys={addressesKeys}
            addressIndex={addressIndex}
            setAddressIndex={setAddressIndex}
        />
    );

    return (
        <>
            {Addresses.length > 1 ? select : null}
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
